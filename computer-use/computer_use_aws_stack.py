import os

from aws_cdk import (
    Stack,
    aws_ecr_assets,
    aws_ecr,
    aws_ecs,
    aws_iam,
    aws_ec2,
    aws_logs,
    aws_kms,
    aws_servicediscovery,
    aws_networkfirewall,
    aws_route53resolver,
    aws_iam as iam,
    aws_codepipeline as codepipeline,
    aws_codepipeline_actions as codepipeline_actions,
    aws_codebuild as codebuild,
    aws_s3_assets,
    aws_ecr as ecr,
    aws_codestarconnections as codestar,
    Duration,
    CfnOutput,
    RemovalPolicy,
    Tags,
    Fn,
)
from constructs import Construct


class ComputerUseAwsStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS Key for encryption with required permissions
        encryption_key = aws_kms.Key(
            self,
            "ComputerUseAwsKey",
            enable_key_rotation=True,
            pending_window=Duration.days(7),
            removal_policy=RemovalPolicy.DESTROY,
            alias="computer-use-aws-key",
            policy=aws_iam.PolicyDocument(
                statements=[
                    aws_iam.PolicyStatement(
                        actions=["kms:*"],
                        principals=[aws_iam.AccountRootPrincipal()],
                        resources=["*"],
                    ),
                    aws_iam.PolicyStatement(
                        actions=[
                            "kms:Encrypt*",
                            "kms:Decrypt*",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:Describe*",
                        ],
                        principals=[
                            aws_iam.ServicePrincipal(
                                f"logs.{self.region}.amazonaws.com"
                            )
                        ],
                        resources=["*"],
                        conditions={
                            "ArnLike": {
                                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{self.account}:*"
                            }
                        },
                    ),
                    iam.PolicyStatement(
                        actions=[
                            "kms:Encrypt*",
                            "kms:Decrypt*",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:Describe*",
                        ],
                        principals=[
                            iam.ServicePrincipal("codebuild.amazonaws.com"),
                            iam.ServicePrincipal("codepipeline.amazonaws.com"),
                        ],
                    ),
                ]
            ),
        )

        # Create single ECR Repository for both images
        repository = aws_ecr.Repository(
            self,
            "ComputerUseAwsRepository",
            repository_name=f"computer-use-aws-{self.stack_name.lower()}",
            removal_policy=RemovalPolicy.DESTROY,
            empty_on_delete=True,
            image_scan_on_push=True,
            encryption=aws_ecr.RepositoryEncryption.KMS,
            encryption_key=encryption_key,
            image_tag_mutability=aws_ecr.TagMutability.MUTABLE,
        )

        # Create VPC
        vpc = aws_ec2.Vpc(
            self,
            "ComputerUseAwsVPC",
            max_azs=2,
            restrict_default_security_group=True,
            flow_logs={
                "flowlog": aws_ec2.FlowLogOptions(
                    destination=aws_ec2.FlowLogDestination.to_cloud_watch_logs(),
                    traffic_type=aws_ec2.FlowLogTrafficType.ALL,
                )
            },
        )

        # Create Route 53 DNS Firewall Domain List for allowed domains
        cfn_firewall_domain_list = aws_route53resolver.CfnFirewallDomainList(
            self,
            "ComputerUseDomainList",
            domains=[
                # A2Z domains
                "a2z.com",
                "*.a2z.com",
                # Amazon core domains
                "amazon.com",
                "*.amazon.com",
                "*.amazonaws.com",
                "*.awsstatic.com",
                "*.media-amazon.com",
                "*.ssl-images-amazon.com",
                "*.amazon-adsystem.com",
                # AWS specific domains
                "aws.dev",
                "*.aws.dev",
                "console.aws.amazon.com",
                "*.console.aws.amazon.com",
                "*.cloudfront.net",
                "execute-api.amazonaws.com",
                "*.execute-api.amazonaws.com",
                "*.ecr.amazonaws.com",
                "*.ecs.amazonaws.com",
                "*.logs.amazonaws.com",
                # Anthropic domains
                "anthropic.com",
                "*.anthropic.com",
                "claude.ai",
                "*.claude.ai",
                # GitHub domains
                "github.com",
                "*.github.com",
                "*.githubassets.com",
                # Google domains
                "google.com",
                "*.google.com",
                "*.googleapis.com",
                "*.gstatic.com",
                # Python package domains
                "pypi.org",
                "*.pypi.org",
                "pythonhosted.org",
                "*.pythonhosted.org",
                # Internal domains
                "*.computer-use.local",
                "computer-use.local",
            ],
            name="computer-use-domain-list",
        )

        # Create a separate domain list for blocked domains
        blocked_domain_list = aws_route53resolver.CfnFirewallDomainList(
            self,
            "ComputerUseBlockedDomainList",
            domains=["*"],  # Block all domains not explicitly allowed
            name="computer-use-blocked-domain-list",
        )

        # Create Route 53 DNS Firewall Rule Group
        dns_firewall_rule_group = aws_route53resolver.CfnFirewallRuleGroup(
            self,
            "DnsFirewallRuleGroup",
            name="computer-use-dns-firewall",
            firewall_rules=[
                aws_route53resolver.CfnFirewallRuleGroup.FirewallRuleProperty(
                    firewall_domain_list_id=cfn_firewall_domain_list.attr_id,
                    action="ALLOW",
                    priority=1000,  # Allow rule processes first
                ),
                aws_route53resolver.CfnFirewallRuleGroup.FirewallRuleProperty(
                    firewall_domain_list_id=blocked_domain_list.attr_id,
                    action="BLOCK",
                    priority=2000,  # Block rule processes second
                    block_response="NODATA",
                ),
            ],
        )

        # Associate DNS Firewall Rule Group with the VPC
        dns_firewall_rule_group_association = (
            aws_route53resolver.CfnFirewallRuleGroupAssociation(
                self,
                "DnsFirewallRuleGroupAssociation",
                firewall_rule_group_id=dns_firewall_rule_group.attr_id,
                priority=1000,
                vpc_id=vpc.vpc_id,
                name="computer-use-dns-firewall-association",
            )
        )

        # Create ECS cluster
        cluster = aws_ecs.Cluster(
            self,
            "ComputerUseAwsCluster",
            cluster_name="computer-use-aws-cluster",
            vpc=vpc,
            container_insights=True,
        )

        # Create private DNS namespace for service discovery
        dns_namespace = cluster.add_default_cloud_map_namespace(
            name="computer-use.local",
            type=aws_servicediscovery.NamespaceType.DNS_PRIVATE,
        )

        # Create IAM role for ECS task execution with unique name
        execution_role = aws_iam.Role(
            self,
            "EcsTaskExecutionRole",
            assumed_by=aws_iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            role_name=f"computer-use-aws-execution-role-{self.stack_name.lower()}",
            max_session_duration=Duration.hours(1),
            description="Role for Computer Use AWS ECS task execution",
        )

        # Create Log Group with unique name
        log_group_name = f"/ecs/computer-use-aws-{self.stack_name.lower()}"
        log_group = aws_logs.LogGroup(
            self,
            "ComputerUseAwsLogGroup",
            log_group_name=log_group_name,
            removal_policy=RemovalPolicy.DESTROY,
            retention=aws_logs.RetentionDays.ONE_MONTH,
            encryption_key=encryption_key,
        )

        # Add specific permissions instead of managed policy
        execution_role.add_to_policy(
            aws_iam.PolicyStatement(
                actions=[
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                ],
                resources=[repository.repository_arn],
            )
        )

        execution_role.add_to_policy(
            aws_iam.PolicyStatement(
                actions=["logs:CreateLogStream", "logs:PutLogEvents"],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:{log_group_name}:*"
                ],
            )
        )

        # Create task role with Bedrock access for orchestration container
        orchestration_task_role = aws_iam.Role(
            self,
            "ComputerUseAwsOrchestrationTaskRole",
            assumed_by=aws_iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
            role_name=f"computer-use-aws-orchestration-task-role-{self.stack_name.lower()}",
            max_session_duration=Duration.hours(1),
            description="Role for Computer Use AWS Orchestration ECS task",
        )

        # Add Bedrock full access to orchestration task role
        orchestration_task_role.add_managed_policy(
            aws_iam.ManagedPolicy.from_aws_managed_policy_name(
                "AmazonBedrockFullAccess"
            )
        )

        # Create environment task definition
        environment_task_definition = aws_ecs.FargateTaskDefinition(
            self,
            "ComputerUseAwsEnvironmentTaskDef",
            execution_role=execution_role,
            family="computer-use-aws-environment-task",
            cpu=1024 * 2,
            memory_limit_mib=1024 * 4,
            runtime_platform=aws_ecs.RuntimePlatform(
                operating_system_family=aws_ecs.OperatingSystemFamily.LINUX,
                cpu_architecture=aws_ecs.CpuArchitecture.ARM64,
            ),
        )

        # Create orchestration task definition
        orchestration_task_definition = aws_ecs.FargateTaskDefinition(
            self,
            "ComputerUseAwsOrchestrationTaskDef",
            execution_role=execution_role,
            task_role=orchestration_task_role,
            family="computer-use-aws-orchestration-task",
            cpu=1024 * 2,
            memory_limit_mib=1024 * 4,
            runtime_platform=aws_ecs.RuntimePlatform(
                operating_system_family=aws_ecs.OperatingSystemFamily.LINUX,
                cpu_architecture=aws_ecs.CpuArchitecture.ARM64,
            ),
        )

        # Add containers to their respective task definitions
        environment_container = environment_task_definition.add_container(
            "EnvironmentContainer",
            image=aws_ecs.ContainerImage.from_ecr_repository(
                repository=repository, tag="environment-latest"
            ),
            logging=aws_ecs.LogDrivers.aws_logs(
                stream_prefix="ecs-environment",
                log_group=log_group,
            ),
            essential=True,
            readonly_root_filesystem=False,
            privileged=False,
        )

        orchestration_container = orchestration_task_definition.add_container(
            "OrchestrationContainer",
            image=aws_ecs.ContainerImage.from_ecr_repository(
                repository=repository, tag="orchestration-latest"
            ),
            logging=aws_ecs.LogDrivers.aws_logs(
                stream_prefix="ecs-orchestration",
                log_group=log_group,
            ),
            essential=True,
            readonly_root_filesystem=False,
            privileged=False,
        )

        # Add port mappings to the environment container
        environment_container.add_port_mappings(
            aws_ecs.PortMapping(container_port=8443, host_port=8443),  # DVC
            aws_ecs.PortMapping(container_port=5000, host_port=5000),  # Flask
        )

        # Add port mapping to the orchestration container
        orchestration_container.add_port_mappings(
            aws_ecs.PortMapping(container_port=8501, host_port=8501)
        )

        deployer_ip = self.format_ip_with_cidr(
            self.node.try_get_context("deployer_ip"),
            fail_secure=True,  # Change this to False to fail open
        )
        # Log the IP being used for security groups
        print(f"Configuring security groups with IP: {deployer_ip}")

        # Create security group for environment container
        environment_security_group = aws_ec2.SecurityGroup(
            self,
            "EnvironmentSecurityGroup",
            vpc=vpc,
            allow_all_outbound=True,
            description="Security group for environment container",
            security_group_name=f"computer-use-aws-env-sg-{self.stack_name.lower()}",
        )

        # Create security group for orchestration container
        orchestration_security_group = aws_ec2.SecurityGroup(
            self,
            "OrchestrationSecurityGroup",
            vpc=vpc,
            allow_all_outbound=True,
            description="Security group for orchestration container",
            security_group_name=f"computer-use-aws-orch-sg-{self.stack_name.lower()}",
        )

        # Allow Flask access only from orchestration container
        environment_security_group.add_ingress_rule(
            peer=aws_ec2.Peer.security_group_id(
                orchestration_security_group.security_group_id
            ),
            connection=aws_ec2.Port.tcp(5000),
            description="Allow traffic from orchestrator on Flask port",
        )

        # Allow access to DVC port from deployer IP
        environment_security_group.add_ingress_rule(
            peer=aws_ec2.Peer.ipv4(deployer_ip),
            connection=aws_ec2.Port.tcp(8443),
            description=f"Allow DVC port 8443inbound traffic from {deployer_ip}",
        )

        # Allow public access to orchestration container's Streamlit port
        orchestration_security_group.add_ingress_rule(
            peer=aws_ec2.Peer.ipv4(deployer_ip),
            connection=aws_ec2.Port.tcp(8501),
            description=f"Allow inbound traffic on port 8501 from {deployer_ip}",
        )

        # Create ECS services for both containers
        environment_service = aws_ecs.FargateService(
            self,
            "ComputerUseAwsEnvironmentService",
            cluster=cluster,
            task_definition=environment_task_definition,
            security_groups=[environment_security_group],
            vpc_subnets=aws_ec2.SubnetSelection(subnet_type=aws_ec2.SubnetType.PUBLIC),
            assign_public_ip=True,
            service_name=f"computer-use-aws-env-service-{self.stack_name.lower()}",
            desired_count=1,
            deployment_controller=aws_ecs.DeploymentController(
                type=aws_ecs.DeploymentControllerType.ECS
            ),
            min_healthy_percent=0,
            max_healthy_percent=100,
            enable_execute_command=False,
            cloud_map_options=aws_ecs.CloudMapOptions(
                name="environment",  # This will create environment.computer-use.local
                dns_record_type=aws_servicediscovery.DnsRecordType.A,
                dns_ttl=Duration.seconds(60),
                cloud_map_namespace=dns_namespace,
            ),
        )

        orchestration_service = aws_ecs.FargateService(
            self,
            "ComputerUseAwsOrchestrationService",
            cluster=cluster,
            task_definition=orchestration_task_definition,
            security_groups=[orchestration_security_group],
            vpc_subnets=aws_ec2.SubnetSelection(subnet_type=aws_ec2.SubnetType.PUBLIC),
            assign_public_ip=True,
            service_name=f"computer-use-aws-orch-service-{self.stack_name.lower()}",
            desired_count=1,
            deployment_controller=aws_ecs.DeploymentController(
                type=aws_ecs.DeploymentControllerType.ECS
            ),
            min_healthy_percent=0,
            max_healthy_percent=100,
            enable_execute_command=False,
            cloud_map_options=aws_ecs.CloudMapOptions(
                name="orchestration",  # This will create orchestration.computer-use.local
                dns_record_type=aws_servicediscovery.DnsRecordType.A,
                dns_ttl=Duration.seconds(60),
                cloud_map_namespace=dns_namespace,
            ),
        )

        # Create S3 assets for both images
        env_asset = aws_s3_assets.Asset(
            self, "EnvironmentImageAsset", path="./computer_use_aws/environment_image"
        )

        orch_asset = aws_s3_assets.Asset(
            self,
            "OrchestrationImageAsset",
            path="./computer_use_aws/orchestration_image",
        )

        # Create CodeBuild project for environment image
        env_build_project = codebuild.Project(
            self,
            "EnvironmentBuildProject",
            source=codebuild.Source.s3(
                bucket=env_asset.bucket, path=env_asset.s3_object_key
            ),
            build_spec=codebuild.BuildSpec.from_object(
                {
                    "version": "0.2",
                    "phases": {
                        "pre_build": {
                            "commands": [
                                "echo Logging in to Amazon ECR...",
                                "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com",
                            ]
                        },
                        "build": {
                            "commands": [
                                "echo Build started on `date`",
                                "echo Building the Docker image...",
                                "docker build -t $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .",
                                "docker tag $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION $ECR_REPO_URI:environment-latest",
                            ]
                        },
                        "post_build": {
                            "commands": [
                                "echo Build completed on `date`",
                                "echo Pushing the Docker image...",
                                "docker push $ECR_REPO_URI:environment-latest",
                            ]
                        },
                    },
                }
            ),
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
                privileged=True,
            ),
            environment_variables={
                "ECR_REPO_URI": codebuild.BuildEnvironmentVariable(
                    value=repository.repository_uri
                ),
                "AWS_DEFAULT_REGION": codebuild.BuildEnvironmentVariable(
                    value=self.region
                ),
                "AWS_ACCOUNT_ID": codebuild.BuildEnvironmentVariable(
                    value=self.account
                ),
            },
        )

        # Create CodeBuild project for orchestration image
        orch_build_project = codebuild.Project(
            self,
            "OrchestrationBuildProject",
            source=codebuild.Source.s3(
                bucket=orch_asset.bucket, path=orch_asset.s3_object_key
            ),
            build_spec=codebuild.BuildSpec.from_object(
                {
                    "version": "0.2",
                    "phases": {
                        "pre_build": {
                            "commands": [
                                "echo Logging in to Amazon ECR...",
                                "aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com",
                            ]
                        },
                        "build": {
                            "commands": [
                                "echo Build started on `date`",
                                "echo Building the Docker image...",
                                "docker build -t $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION .",
                                "docker tag $ECR_REPO_URI:$CODEBUILD_RESOLVED_SOURCE_VERSION $ECR_REPO_URI:orchestration-latest",
                            ]
                        },
                        "post_build": {
                            "commands": [
                                "echo Build completed on `date`",
                                "echo Pushing the Docker image...",
                                "docker push $ECR_REPO_URI:orchestration-latest",
                            ]
                        },
                    },
                }
            ),
            environment=codebuild.BuildEnvironment(
                build_image=codebuild.LinuxArmBuildImage.AMAZON_LINUX_2_STANDARD_3_0,
                privileged=True,
            ),
            environment_variables={
                "ECR_REPO_URI": codebuild.BuildEnvironmentVariable(
                    value=repository.repository_uri
                ),
                "AWS_DEFAULT_REGION": codebuild.BuildEnvironmentVariable(
                    value=self.region
                ),
                "AWS_ACCOUNT_ID": codebuild.BuildEnvironmentVariable(
                    value=self.account
                ),
            },
        )

        # Grant permissions
        repository.grant_pull_push(env_build_project)
        repository.grant_pull_push(orch_build_project)
        encryption_key.grant_encrypt_decrypt(env_build_project)
        encryption_key.grant_encrypt_decrypt(orch_build_project)

        pipeline_role = aws_iam.Role(
            self,
            "PipelineRoleBuiltByMe",
            assumed_by=aws_iam.ServicePrincipal("codepipeline.amazonaws.com"),
            inline_policies={
                "S3Access": aws_iam.PolicyDocument(
                    statements=[
                        aws_iam.PolicyStatement(
                            actions=["s3:GetObject", "s3:GetObjectVersion"],
                            resources=[
                                f"{env_asset.bucket.bucket_arn}/*",
                                f"{orch_asset.bucket.bucket_arn}/*",
                            ],
                        ),
                        aws_iam.PolicyStatement(
                            actions=["s3:GetBucketVersioning"],
                            resources=[
                                env_asset.bucket.bucket_arn,
                                orch_asset.bucket.bucket_arn,
                            ],
                        ),
                        aws_iam.PolicyStatement(
                            actions=["sts:AssumeRole"], resources=["*"]
                        ),
                    ]
                )
            },
        )

        source_action_role = aws_iam.Role(
            self,
            "S3SourceBuiltByMe",
            assumed_by=pipeline_role,
            inline_policies={
                "S3Access": aws_iam.PolicyDocument(
                    statements=[
                        aws_iam.PolicyStatement(
                            actions=["s3:GetObject", "s3:GetObjectVersion"],
                            resources=[
                                f"{env_asset.bucket.bucket_arn}/*",
                                f"{orch_asset.bucket.bucket_arn}/*",
                            ],
                        ),
                        aws_iam.PolicyStatement(
                            actions=["s3:GetBucketVersioning"],
                            resources=[
                                env_asset.bucket.bucket_arn,
                                orch_asset.bucket.bucket_arn,
                            ],
                        ),
                    ]
                )
            },
        )

        # Create CodePipeline
        pipeline = codepipeline.Pipeline(
            self,
            "ComputerUsePipeline",
            pipeline_type=codepipeline.PipelineType.V2,
            role=pipeline_role,
        )

        # Source stage
        env_source_output = codepipeline.Artifact("EnvSource")
        orch_source_output = codepipeline.Artifact("OrchSource")

        env_source_action = codepipeline_actions.S3SourceAction(
            action_name="EnvS3Source",
            bucket=env_asset.bucket,
            bucket_key=env_asset.s3_object_key,
            output=env_source_output,
            role=source_action_role,
        )

        orch_source_action = codepipeline_actions.S3SourceAction(
            action_name="OrchS3Source",
            bucket=orch_asset.bucket,
            bucket_key=orch_asset.s3_object_key,
            output=orch_source_output,
            role=source_action_role,
        )

        pipeline.add_stage(
            stage_name="Source", actions=[env_source_action, orch_source_action]
        )

        # Build stage
        env_build_output = codepipeline.Artifact("EnvBuild")
        orch_build_output = codepipeline.Artifact("OrchBuild")

        env_build_action = codepipeline_actions.CodeBuildAction(
            action_name="BuildEnvAction",
            project=env_build_project,
            input=env_source_output,
            outputs=[env_build_output],
        )

        orch_build_action = codepipeline_actions.CodeBuildAction(
            action_name="BuildOrchAction",
            project=orch_build_project,
            input=orch_source_output,
            outputs=[orch_build_output],
        )

        pipeline.add_stage(
            stage_name="Build", actions=[env_build_action, orch_build_action]
        )

        # Outputs
        CfnOutput(
            self,
            "RepositoryUri",
            value=repository.repository_uri,
            description="URI for the ECR repository",
        )

        CfnOutput(
            self,
            "OrchestrationServiceNote",
            value="After deployment, find the public IP of the Orchestration task in ECS Console and connect via http://<public-ip>:8501",
            description="Instructions to connect to Orchestration Service",
        )

        CfnOutput(
            self,
            "EnvironmentServiceNote",
            value="After deployment, find the public IP of the Environment task in ECS Console and connect via https://<public-ip>:8443",
            description="Instructions to connect to Environment Service",
        )

        CfnOutput(
            self,
            "EnvironmentServiceDNS",
            value="environment.computer-use.local",
            description="DNS name for Environment Service (internal VPC access only)",
        )

        CfnOutput(
            self,
            "OrchestrationServiceDNS",
            value="orchestration.computer-use.local",
            description="DNS name for Orchestration Service (internal VPC access only)",
        )

        CfnOutput(
            self,
            "DnsFirewallRuleGroupId",
            value=dns_firewall_rule_group.attr_id,
            description="DNS Firewall Rule Group ID",
        )

        CfnOutput(
            self,
            "DnsFirewallDomainListId",
            value=cfn_firewall_domain_list.attr_id,
            description="DNS Firewall Domain List ID",
        )

        # Add tags
        Tags.of(self).add("Project", "ComputerUseAws")
        Tags.of(self).add("Environment", "Sandbox")

    def format_ip_with_cidr(self, ip: str, fail_secure: bool = True) -> str:
        """
        Format IP address with CIDR notation and validate
        Args:
            ip: IP address to format (can be single IP or CIDR range)
            fail_secure: If True, defaults to '255.255.255.255/32' (blocks all) on failure
                        If False, defaults to '0.0.0.0/0' (allows all) on failure
        Returns:
            str: Properly formatted CIDR range
        """
        if not ip:
            default_ip = "255.255.255.255/32" if fail_secure else "0.0.0.0/0"
            print(f"Warning: No deployer IP provided. Defaulting to {default_ip}")
            return default_ip

        # If IP already has CIDR notation, return as-is
        if "/" in ip:
            try:
                # Basic validation of CIDR format
                address, mask = ip.split("/")
                mask_int = int(mask)
                if mask_int < 0 or mask_int > 32:
                    raise ValueError("Invalid CIDR mask")
                return ip
            except ValueError:
                print(f"Warning: Invalid CIDR format '{ip}'. Using default.")
                return "255.255.255.255/32" if fail_secure else "0.0.0.0/0"

        # Add /32 for single IP addresses
        return f"{ip}/32"
