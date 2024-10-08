from flask import Flask, request, jsonify
from openai import OpenAI

client = OpenAI()

app = Flask(__name__)

@app.route("/")
def welcome():
    return "Welcome Ubayed"

@app.route("/answer", methods=["GET", "POST"])
# Function to call OpenAI's ChatGPT API
def call_openai_api():
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an AI assistant specializing in providing the latest news and updates in the field of artificial intelligence, including breakthroughs, research, industry trends, and important developments. Provide accurate and concise information about the most recent events in AI, and prioritize the most relevant news."},
            {"role": "user", "content": "Hello!"}
        ],
        completion=True
        #print(completion.choices[0].message)
    ) 

    for chunk in completion:
        if chunk.choices[0].delta.content is not None:
            yield(chunk.choices[0].delta.content)

    return call_openai_api(), {"Content-Type": "text/plain"}

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json()
    if 'messages' not in data:
        return jsonify({'error': 'Messages are required'}), 400

    messages = data['messages']
    response = call_openai_api(messages)
    
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)