import aws_cdk as core
import aws_cdk.assertions as assertions

from computer use aws.computer use aws_stack import ComputerUseAwsStack

# example tests. To run these tests, uncomment this file along with the example
# resource in computer use aws/computer use aws_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = ComputerUseAwsStack(app, "computer-use-aws")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
