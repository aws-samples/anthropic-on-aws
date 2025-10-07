#!/usr/bin/env python3
import os
import aws_cdk as cdk
from computer_use_aws_stack import ComputerUseAwsStack

app = cdk.App()
ComputerUseAwsStack(app, "ComputerUseAwsStack",
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region='us-west-2'
    ),
)

app.synth()