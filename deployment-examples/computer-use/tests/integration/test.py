import requests

url = "http://54.244.97.19:5000/execute"
payload = {
    "tool": "computer",
    "input": {"action": "screenshot"}
}
response = requests.post(url, json=payload)
print(response.json())