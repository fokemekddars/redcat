export async function handler(event) {
  const { subreddit = "python", limit = 100, t = "week", postId, comments } = event.queryStringParameters || {};

  if (!subreddit) {
    return {
      statusCode: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ error: "Subreddit parameter is required" })
    };
  }

  try {
    let url;

    // Build URL for comments or top posts
    if (comments && postId) {
      url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?sort=top&limit=10`;
    } else {
      url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=${t}`;
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "script:redcat:v1.0 (by u/YOUR_USERNAME)",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      return { 
        statusCode: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({ error: `Reddit JSON feed error: ${response.status} ${response.statusText}` })
      };
    }

    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error('Reddit proxy error:', error);
    
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: JSON.stringify({ 
        error: "Failed to fetch Reddit data",
        details: error.message
      })
    };
  }
}
