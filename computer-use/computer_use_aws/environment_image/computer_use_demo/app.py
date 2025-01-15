from flask import Flask, request, jsonify
from tools import BashTool, ComputerTool, EditTool, ToolCollection

app = Flask(__name__)

tool_collection = ToolCollection(
    ComputerTool(),
    BashTool(),
    EditTool(),
)

@app.route('/execute', methods=['POST'])
async def execute_tool():
    data = request.json
    tool_name = data.get('tool')
    tool_input = data.get('input')

    if not tool_name or not tool_input:
        return jsonify({"error": "Missing tool name or input"}), 400

    try:
        result = await tool_collection.run(name=tool_name, tool_input=tool_input)
        return jsonify({"result": result.to_dict()})
    except Exception as e:
        print(e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
