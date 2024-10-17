from openai import OpenAI
from flask import Flask, request, jsonify
from flask_cors import CORS  # Import CORS
from bs4 import BeautifulSoup
import requests

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

# Define a function to extract website content
def web_crawler(url):
    try:
        response = requests.get(url)
        if response.status_code != 200:
            return f"Failed to retrieve website: Status code {response.status_code}"
        
        soup = BeautifulSoup(response.content, 'html.parser')
        title = soup.title.string if soup.title else "No title found"
        text = soup.get_text(separator=' ', strip=True)

        return {
            "title": title,
            "text": text
        }
    except requests.exceptions.RequestException as e:
        return f"An error occurred: {e}"

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/")
def welcome():
    return "Welcome Ubayed"

@app.route("/AI_news", methods=["POST"])
def answer():
    data = request.get_json()
    
    # Check if 'url' is provided in the request
    if 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400

    # Get the messages from the request
    url = data['url']

    # Fetch website content using web_crawler
    website_details = web_crawler(url)

    if isinstance(website_details, str):
        return jsonify({'error': website_details}), 400
    
    # Prepare GPT message based on website content
    messages = [
        {
            "role": "system", 
            "content": "You are an AI assistant specializing in summarizing complex and detailed website content concisely. Focus on capturing key news highlights related to artificial intelligence, summarizing the main points without unnecessary details."
        },
        {
            "role": "user", 
            "content": f"""Summarize the following content from MIT's AI news:
            Title: {website_details['title']}
            Text: {website_details['text']}
            Focus on the most important updates in AI research, including new projects, technological advancements, and research initiatives mentioned on the website."""
        }
    ]

    # Call OpenAI API and get the response
    response_text = chat_with_gpt(messages)

    # Return the GPT-generated summary
    return jsonify({'News Summary: ': response_text})

if __name__ == "__main__":
    app.run(debug=True)


# curl -X POST http://localhost:5000/AI_news -H "Content-Type: application/json" -d '{ "url": "https://news.mit.edu/topic/artificial-intelligence2" }'
# curl -X POST http://localhost:5000/AI_news -H "Content-Type: application/json" -d '{ "url": "https://techcrunch.com/category/artificial-intelligence/" }'
# curl -X POST http://localhost:5000/AI_news -H "Content-Type: application/json" -d '{ "url": "https://www.artificialintelligence-news.com/" }'