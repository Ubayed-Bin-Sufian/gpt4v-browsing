import openai

openai.api_key = ""

# Print or use the API key
print(f"Your OpenAI API Key is: {openai.api_key}")

# Define a function to interact with GPT
def chat_with_gpt(prompt):

    # Call the OpenAI API with the provided prompt
    response = openai.ChatCompletion.create(
      model="gpt-4o-mini",
      messages=[{"role": "user", "content": prompt}]
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