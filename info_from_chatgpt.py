from openai import OpenAI

OPENAI_KEY=""
client = OpenAI(api_key=OPENAI_KEY)

# Define a function to interact with GPT
def chat_with_gpt(prompt):

    # Call the OpenAI API with the provided prompt
    response = client.chat.completions.create(
      model="gpt-4o-mini",
      messages=[
            {"role": "system", "content": "You are an AI assistant specializing in providing the latest news and updates in the field of artificial intelligence, including breakthroughs, research, industry trends, and important developments. Provide accurate and concise information about the most recent events in AI, and prioritize the most relevant news."},
            {"role": "user", "content": prompt}
        ]
    )
   
    # Return the generated response after stripping whitespace
    return response.choices[0].message.content.strip()

if __name__ == "__main__":
    while True:

        # Start an infinite loop to chat with the user
        user_input = input("You: ")
        if user_input.lower() in ["quit", "exit", "bye"]:
            break

        # Get response from the chat_with_gpt function
        response = chat_with_gpt(user_input)
        print("Chatbot:", response)