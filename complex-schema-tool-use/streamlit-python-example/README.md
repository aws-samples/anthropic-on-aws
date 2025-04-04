## Using this demo

To get started, you will need the following:

- AWS CLI [Installed](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html) and [Configured](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
- Amazon Bedrock [Model Access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html) for Claude 3 Sonnet
- Python [Installed](https://www.python.org/downloads/)

With these installed and configured, you can clone this repo.

```bash
git clone https://github.com/aws-samples/anthropic-on-aws.git
cd anthropic-on-aws/complex-schema-tool-use/streamlit-python-example
```

And create a virtual environment and install the necessary packages.

```bash
python3 -m venv ./
source bin/activate
pip3 install -r requirements.txt
```

And now run the Streamlit App

```bash
streamlit run tool_use/chatbot_example.py
```

This should open a browser to `http://localhost:8501/` or something similar. To get started, tell the bot you'd like to order a pizza.
