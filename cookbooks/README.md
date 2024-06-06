# bedrock-cookbooks

This repo contains cookbooks from [anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook) converted to use [Amazon Bedrock](https://aws.amazon.com/bedrock/) instead of the Anthropic SDK. These cookbooks can be run using a platform that supports a Jupyter notebook like [Amazon SageMaker](https://docs.aws.amazon.com/sagemaker/latest/dg/nbi.html).

These notebooks were largely converted from the existing Anthropic examples using a Python script that uses Amazon Bedrock to perform code updates. This script can be found [here](convert_to_bedrock/convert.py).
