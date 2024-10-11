from openai import OpenAI
from flask import Flask, request, jsonify

OPENAI_KEY=""
client = OpenAI(api_key=OPENAI_KEY)

# Define a function to interact with GPT
def chat_with_gpt(messages):

    # Call the OpenAI API with the provided prompt
    response = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=messages
    )
   
    # Return the generated response after stripping whitespace
    return response.choices[0].message.content.strip()

app = Flask(__name__)

@app.route("/")
def welcome():
    return "Welcome Ubayed"

@app.route("/AI_news", methods=["POST"])
def answer():
    data = request.get_json()
    
    # Check if 'messages' is provided in the request
    if 'messages' not in data:
        return jsonify({'error': 'Messages are required'}), 400

    # Get the messages from the request
    messages = data['messages']

    # Call OpenAI API and get the response
    response_text = chat_with_gpt(messages)

    # Return the AI's response as plain text
    return jsonify({'response': response_text})

if __name__ == "__main__":
    app.run(debug=True)

# #curl request (copy the following and paste it in the git bash)
# curl -X POST http://localhost:5000/AI_news -H "Content-Type: application/json" -d '{
#   "messages": [
#     {
#       "role": "system",
#       "content": "You are an AI assistant specializing in delivering the top three news stories in the field of artificial intelligence. Each story should be summarized in no more than 200 words, focusing on the most recent and impactful developments in AI research, industry trends, and breakthroughs. Prioritize concise, clear, and relevant news that keeps the user informed about the latest advancements."},
#     },
#     {
#       "role": "user",
#       "content": "Can you tell me the latest updates in AI research?"
#     }
#   ]
# }'