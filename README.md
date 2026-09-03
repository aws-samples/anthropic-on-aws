# Anthropic on AWS

> ⚠️ **Deprecation Notice (Jul 2026):** Amazon Bedrock Agents has been renamed
> "Bedrock Agents Classic" and moved to **maintenance mode** as of Jun 30, 2026.
> New customers are blocked from creating Bedrock Agents resources from Jul 30, 2026.
> The successor service is **Amazon Bedrock AgentCore** (GA since Oct 2025).
> Please migrate existing agent workloads.
> See the [maintenance mode announcement](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-classic-maintenance-mode.html),
> [AgentCore documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore.html),
> and the [migration guide](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-classic-migration.html).

This repo contains a collection of examples and notebooks for using Anthropic on AWS.

## Dependencies and security

The samples in this repo are point-in-time examples. They are not maintained as
products, and their dependencies are **not** kept current after publication.
Before deploying any sample, refresh its dependencies (`npm install`,
`yarn upgrade`, `uv pip install -U -r requirements.txt`, or equivalent) and
review the result. Dependabot alerts on unmaintained samples are dismissed as
tolerable risk for this reason; in-range security fixes are still merged as
Dependabot opens them.

## Notebooks
- [Cookbooks](/cookbooks/README.md)

## Workshops
- [Prompt Engineering](https://github.com/aws-samples/prompt-engineering-with-anthropic-claude-v-3)

## Demos
- [Metaprompt Generator](metaprompt-generator/README.md)
- [Tool Use (function calling) with complex tool schemas](complex-schema-tool-use/README.md)
- [Claude Streamlit LLM Playground (supports Claude 3.5)](claude-multimodal-llm-playground/README.md)
- [Claude Tools Chatbot](claude-tools-chatbot/README.md)
- [Classification with Intercom](classification-with-intercom/README.md)
- [PDF Knowledge Base with Citations](pdf-knowledge-base-with-citations/README.md)
