## Implementation

Streamlit app invokes Step Functions workflow directly everytime user enters input in the textbox. Workflow invokes Amazon Bedrock converse API, identifies if a tool is needed to be called, routes to appropriate tools, builds the response and sends back to the streamlit app. We used Step Functions Express workflow. Express workflows are suitable for high scale short lived transaction type of use cases. They can be called synchronously.

![workflow](/complex-schema-tool-use/streamlit-stepfunction-example/stepfunctions_graph.png)

## Using this demo

To get started, you will need the following:

- AWS CLI [Installed](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) and [Configured](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
- Amazon Bedrock [Model Access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) for Claude 3 Sonnet
- Python [Installed](https://www.python.org/downloads/)
- SAM CLI [Installed](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)
- [Streamlit](https://streamlit.io/)

With these installed and configured, you can clone this repo.

```bash
git clone https://github.com/aws-samples/anthropic-on-aws.git
cd anthropic-on-aws/complex-schema-tool-use/streamlit-stepfunction-example
```

And create a virtual environment and install the necessary packages.

```bash
python3 -m venv ./
source bin/activate
pip3 install -r requirements.txt

```

And deploy the cloudformation stack that creates the Step Functions

```bash
sam build
sam deploy -g
```

And now run the Streamlit App
Copy the value for **ToolUseCoverseAPIStateMachineArn** from the output of the cloudformation stack. Substitute it in the command below

```bash
streamlit run tool_use/chatbot_example.py <Statemachine_ARN>
```

This should open a browser to `http://localhost:8501/` or something similar. To get started, tell the bot you'd like to order a pizza.
