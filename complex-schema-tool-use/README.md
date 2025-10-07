# Using Complex JSON Schema with Claude 3 Tools

> **Note**: This project has been reorganized! The examples are now split by technology stack for better discoverability:
> - **Streamlit Python Example** → [streamlit-applications/streamlit-python-example](../streamlit-applications/streamlit-python-example/)
> - **Streamlit Step Functions Example** → [streamlit-applications/streamlit-stepfunction-example](../streamlit-applications/streamlit-stepfunction-example/)
> - **Next.js TypeScript Example** → [deployment-examples/nextjs-complex-schema](../deployment-examples/nextjs-complex-schema/)

---

In these demos, we show how to use complex JSON schema with Claude 3 using the [tools use feature](https://docs.anthropic.com/en/docs/tool-use#how-tool-use-works). This is meant as a simple and customizable demonstration you can use to familiarize yourself with how tools work. A basic understanding of tools use on Claude will be important for understanding this demo.

![OrderAPizza](images/OrderAPizza.png)
_Image from Streamlit example_

From here the bot will use the [tool use feature](https://docs.anthropic.com/en/docs/tool-use) of Claude to walk through the process of ordering a pizza. In this demo, we're not actually going to make a function call so the [output](https://docs.anthropic.com/en/docs/tool-use#json-output) will be the JSON that Claude thinks it needs to provide to call the function.

## Examples by Technology

### [Streamlit Python Example](../streamlit-applications/streamlit-python-example/)
**Basic Streamlit implementation demonstrating complex tool schemas**
- **Tech**: Python, Streamlit, Amazon Bedrock
- **Purpose**: Interactive demo of complex JSON schema with tool use
- **Best for**: Understanding tool use patterns, rapid prototyping

### [Streamlit Step Functions Example](../streamlit-applications/streamlit-stepfunction-example/)
**Advanced example integrating AWS Step Functions**
- **Tech**: Python, Streamlit, AWS Step Functions, Amazon Bedrock
- **Purpose**: Show async workflow orchestration with tool use
- **Best for**: Long-running workflows, complex orchestration

### [Next.js TypeScript Example](../deployment-examples/nextjs-complex-schema/)
**Production-ready Next.js implementation with TypeScript**
- **Tech**: Next.js 14, TypeScript, Amazon Bedrock
- **Purpose**: Type-safe tool use with modern web framework
- **Best for**: Production deployments, TypeScript projects

## JSON Schema Fundamentals

The tool use feature uses [JSON schema](https://json-schema.org/) to define the expected parameters of the tool. This means that Claude knows the schema that is is expected to provide the tool and will do it's best to provide that.

### Simple Strings
This can include simple [strings](https://json-schema.org/understanding-json-schema/reference/string):

```json
"delivery_instructions": {
    "type": "string",
    "description": "Any special delivery instructions for the order"
}
```

### Enumerated Values
[Enumerated values](https://json-schema.org/understanding-json-schema/reference/enum):

```json
"size": {
    "type": "string",
    "description": "The size of the pizza",
    "enum": [
        "small",
        "medium",
        "large",
        "extra-large"
    ]
}
```

### Arrays
[Arrays](https://json-schema.org/understanding-json-schema/reference/array):

```json
"toppings": {
    "type": "array",
    "description": "A list of toppings for the pizza",
    "items": {
        "type": "string",
        "enum": [
            "pepperoni",
            "sausage",
            "mushrooms",
            "onions",
            "peppers",
            "olives",
            "extra cheese",
            "ham",
            "pineapple",
            "bacon",
            "anchovies",
            "chicken",
            "tomatoes",
            "garlic",
            "spinach"
        ]
    }
}
```

### Nested Objects
And nested [objects](https://json-schema.org/understanding-json-schema/reference/object):

```json
"customer_details": {
    "type": "object",
    "description": "Details about the customer placing the order",
    "properties": {
        "name": {
            "type": "string",
            "description": "The name of the customer"
        },
        "phone": {
            "type": "string",
            "description": "The phone number of the customer"
        },
        "address": {
            "type": "string",
            "description": "The delivery address for the order"
        }
    },
    "required": [
        "name",
        "phone",
        "address"
    ]
}
```

The complete schema can be found in the [Streamlit Python Example](../streamlit-applications/streamlit-python-example/tool_use/input_schema.py)

## Tool Use Best Practices

When combined with the above schema, Claude will know what fields are required and examples of what to look for in a response. Unlike other prompts for Claude which rely on [examples](https://docs.anthropic.com/en/docs/use-examples) to guide Claude, when using tools, the description is [one of the most important pieces](https://docs.anthropic.com/en/docs/tool-use#best-practices-for-tool-definitions) of information. These descriptions should be applied for each component of the JSON schema.

**Key best practices**:
- Provide clear, descriptive field descriptions
- Use enums to constrain possible values
- Mark required fields appropriately
- Include examples in descriptions when helpful
- Test with various inputs to validate schema

## Prompting

Finally, armed with these tools, we will pass a system prompt and messages to Amazon Bedrock using the Converse API.

```python
system_prompt_with_date = (
    system_prompt
    + "\nThe current date and time is "
    + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
)
converse_api_params = {
    "modelId": MODEL_ID,
    "messages": st.session_state.messages,
    "system": [{"text": system_prompt_with_date}],
    "inferenceConfig": {
        "temperature": TEMPERATURE,
        "maxTokens": MAX_TOKENS,
    },
    "toolConfig": tools,
}
response = bedrock_client.converse(**converse_api_params)
```

_Example from Streamlit Python implementation_

## Result

The result is a simple chat bot that can capture a wide variety of information from a user and produce reliable JSON for further processing.

![ReadyToOrder](images/ReadyToOrder.png)
_Image from Streamlit example_

```json
{
  "output": {
    "message": {
      "role": "assistant",
      "content": [
        {
          "text": "<thinking>\n- The user has provided all the required information to complete their pizza order:\n  - Crust: Gluten-free\n  - Size: Medium\n  - Toppings: Pepperoni, Sausage\n  - Extras: None\n  - Customer Name: Court Schuett\n  - Customer Phone: 815-555-1212\n  - Delivery Address: 123 Main St.\n- I now have everything needed from the data model, so I can invoke the tool to place the order.\n</thinking>"
        },
        {
          "toolUse": {
            "toolUseId": "tooluse_tLSqQR3LQriLD_4P6QgyhA",
            "name": "create_pizza_order",
            "input": {
              "crust": "gluten-free",
              "size": "medium",
              "toppings": ["pepperoni", "sausage"],
              "extras": [],
              "customer_details": {
                "name": "Court Schuett",
                "phone": "815-555-1212",
                "address": "123 Main St."
              }
            }
          }
        }
      ]
    }
  },
  "stopReason": "tool_use"
}
```

## Getting Started

### Choose Your Technology Stack

1. **Quick prototyping?** → [Streamlit Python Example](../streamlit-applications/streamlit-python-example/)
2. **Need Step Functions?** → [Streamlit Step Functions Example](../streamlit-applications/streamlit-stepfunction-example/)
3. **Production deployment?** → [Next.js TypeScript Example](../deployment-examples/nextjs-complex-schema/)

Each example includes:
- Complete setup instructions
- Working code demonstrating the patterns
- Documentation of the JSON schema
- Instructions for customization

## Additional Resources

- **[Tool Use Documentation](https://docs.anthropic.com/en/docs/tool-use)** - Official Anthropic guide
- **[JSON Schema Reference](https://json-schema.org/)** - Schema specification
- **[Streamlit Applications](../streamlit-applications/)** - More Streamlit examples
- **[CDK Applications](../cdk-applications/)** - Production application examples
- **[Code Samples](../code-samples/)** - Additional API examples

## License

MIT-0 - See LICENSE file in repository root
