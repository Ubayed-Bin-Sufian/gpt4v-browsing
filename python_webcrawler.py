from bs4 import BeautifulSoup
import requests    

def web_crawler(url):
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        # Check if the request was successful
        if response.status_code != 200:
            return f"Failed to retrieve website: Status code {response.status_code}"
        # Parse the content of the website
        soup = BeautifulSoup(response.content, 'html.parser')
        # Extract the title of the website
        title = soup.title.string if soup.title else "No title found"
        # Extract all text from the website
        text = soup.get_text(separator=' ', strip=True)
        # Extract all links from the website
        links = [a['href'] for a in soup.find_all('a', href=True)]
        # Return website details
        return {
            "title": title,
            "text": text,  # First 500 characters of text
        }
    except requests.exceptions.RequestException as e:
        return f"An error occurred: {e}"

# Example usage
if __name__ == "__main__":
    url = "https://news.mit.edu/topic/artificial-intelligence2"
    website_details = web_crawler(url)
    # Print the details
    print("Website Title:", website_details['title'])
    print("\nWebsite Text (first 500 chars):", website_details['text'])