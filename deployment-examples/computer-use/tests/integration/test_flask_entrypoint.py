import pytest
import requests
import time

# def test_execute_tool():
#     url = "http://localhost:5000/execute"
#     payload = {
#         "tool": "bash",
#         "input": {"command": "echo 'Hello, World!'"}
#     }
#     response = requests.post(url, json=payload)
#     assert response.status_code == 200
#     result = response.json()
#     assert "result" in result
#     assert "output" in result["result"]
#     assert result["result"]["output"].strip() == "Hello, World!"
    
def test_computer_screenshot():
    url = "http://localhost:5000/execute"
    payload = {
        "tool": "computer",
        "input": {"action": "screenshot"}
    }
    response = requests.post(url, json=payload)
    print(response.json())
    assert response.status_code == 200
    result = response.json()
    assert "result" in result
    assert "output" in result["result"]
    assert result["result"]["output"].strip() == "Hello, World!"