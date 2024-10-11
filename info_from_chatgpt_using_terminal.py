from openai import OpenAI

OPENAI_KEY=""
client = OpenAI(api_key=OPENAI_KEY)

# Define a function to interact with GPT
def chat_with_gpt(prompt):

    # Call the OpenAI API with the provided prompt
    response = client.chat.completions.create(
      model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an AI assistant specializing in delivering the top three news stories in the field of artificial intelligence. Each story should be summarized in no more than 200 words, focusing on the most recent and impactful developments in AI research, industry trends, and breakthroughs. Prioritize concise, clear, and relevant news that keeps the user informed about the latest advancements."},
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