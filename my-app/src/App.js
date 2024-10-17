import React, { useEffect, useState } from 'react';
import axios from 'axios';

const App = () => {
  const [summaries, setSummaries] = useState([]);
  const [error, setError] = useState("");

  // URLs for AI news
  const newsUrls = [
    'https://news.mit.edu/topic/artificial-intelligence2', // MIT AI News
    'https://techcrunch.com/category/artificial-intelligence/', // TechCrunch AI News
    'https://www.artificialintelligence-news.com/' // AI News
  ];

  // Function to fetch the summaries when the component loads
  useEffect(() => {
    const fetchNewsSummaries = async () => {
      try {
        // Use Promise.all to fetch summaries from all URLs in parallel
        const responses = await Promise.all(
          newsUrls.map(url =>
            axios.post('http://localhost:5000/AI_news', { url })
          )
        );

        // Extract and set the summaries from the API responses
        const fetchedSummaries = responses.map((response, index) => ({
          url: newsUrls[index],
          summary: response.data['News Summary: ']
        }));
        setSummaries(fetchedSummaries); // Set the fetched summaries
      } catch (err) {
        setError("An error occurred while fetching the summaries.");
        console.error(err);
      }
    };

    fetchNewsSummaries(); // Fetch summaries when component mounts
  }, []); // Empty dependency array to run effect only once when component mounts

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>AI News Summaries</h1>
      
      {summaries.length > 0 ? (
        summaries.map((item, index) => (
          <div
            key={index}
            style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', width: '80%', margin: 'auto' }}
          >
            <h2>Latest AI News from {new URL(item.url).hostname}</h2>
            <p>{item.summary}</p>
          </div>
        ))
      ) : (
        <p>Loading summaries...</p>
      )}

      {error && (
        <div style={{ marginTop: '30px', color: 'red' }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default App;
