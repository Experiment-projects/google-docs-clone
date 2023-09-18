import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# Function to scrape text content from a URL
def scrape_text_from_url(url):
    try:
        # Send an HTTP GET request to the URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes

        # Parse the HTML content of the page
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract and print the textual content (remove script and style tags)
        for script in soup(['script', 'style']):
            script.extract()

        # Get the text
        text = soup.get_text()

        # Clean up extra whitespace and newlines
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        clean_text = ' '.join(lines)

        return clean_text

    except requests.exceptions.RequestException as e:
        print("Error fetching the URL:", e)
        return None

# Example usage
if __name__ == "__main__":
    url = "https://internship.aicte-india.org/"  # Replace with your desired URL
    text_content = scrape_text_from_url(url)
    
    if text_content:
        print(text_content)
