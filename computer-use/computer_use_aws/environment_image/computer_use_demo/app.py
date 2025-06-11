from flask import Flask, request, jsonify
from tools import ToolResult, ToolCollection, ToolVersion, TOOL_GROUPS_BY_VERSION

app = Flask(__name__)

# Build both sets of tools (20241022 and 20250124)
tool_collections = {}
for version in ["computer_use_20241022", "computer_use_20250124"]:
    tool_group = TOOL_GROUPS_BY_VERSION[version]
    tool_collections[version] = ToolCollection(*(ToolCls() for ToolCls in tool_group.tools))

# Default to the 20241022 version for backward compatibility
tool_version = "computer_use_20241022"
tool_collection = tool_collections[tool_version]

@app.route('/execute', methods=['POST'])
async def execute_tool():
    data = request.json
    tool_name = data.get('tool')
    tool_input = data.get('input')
    requested_version = data.get('tool_version')

    if not tool_name or not tool_input:
        return jsonify({"error": "Missing tool name or input"}), 400

    # Use the requested version if provided and valid, otherwise use default
    current_version = tool_version
    if requested_version and requested_version in tool_collections:
        current_version = requested_version
        current_collection = tool_collections[current_version]
    else:
        current_collection = tool_collection

    try:
        print(f"Executing tool: {tool_name} with input: {tool_input}, version: {current_version}")
        result = await current_collection.run(name=tool_name, tool_input=tool_input)
        return jsonify({"result": {
            "output": result.output,
            "error": result.error,
            "base64_image": result.base64_image,
            "system": result.system,
            "tool_version": current_version
        }})
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
