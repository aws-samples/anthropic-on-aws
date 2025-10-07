import {
  Vpc,
  SubnetType,
  SecurityGroup,
  // Peer,
  Port,
  InterfaceVpcEndpointAwsService,
  InterfaceVpcEndpoint,
} from 'aws-cdk-lib/aws-ec2';
import { PolicyStatement, AnyPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class VPCResources extends Construct {
  public vpc: Vpc;
  public securityGroup: SecurityGroup;
  public bedrockInterfaceEndpoint: InterfaceVpcEndpoint;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.vpc = new Vpc(this, 'VPC', {
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PrivateWithEgress',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    this.securityGroup = new SecurityGroup(this, 'SecurityGroup', {
      vpc: this.vpc,
      description: 'Security Group',
      allowAllOutbound: true,
    });

    this.bedrockInterfaceEndpoint = this.vpc.addInterfaceEndpoint(
      'BedrockAccessPoint',
      {
        service: InterfaceVpcEndpointAwsService.BEDROCK_RUNTIME,
        privateDnsEnabled: true,
      },
    );

    this.bedrockInterfaceEndpoint.addToPolicy(
      new PolicyStatement({
        principals: [new AnyPrincipal()],
        actions: ['bedrock:InvokeModel'],
        resources: ['arn:aws:bedrock:*::foundation-model/*'],
      }),
    );
    this.securityGroup.connections.allowInternally(Port.tcp(5432));
  }
}
