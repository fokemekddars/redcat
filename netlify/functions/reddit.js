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
    let useOAuth = false;

    // Check if Reddit API credentials are available
    if (process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET) {
      useOAuth = true;
    }

    if (useOAuth) {
      // Use official Reddit API with OAuth
      const auth = Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString("base64");

      // Get access token
      const tokenResponse = await fetch("https://www.reddit.com/api/v1/access_token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "netlify-reddit-proxy/1.0"
        },
        body: "grant_type=client_credentials"
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token request failed: ${tokenResponse.status}`);
      }

      const tokenData = await tokenResponse.json();

      // Build API URL
      if (comments && postId) {
        url = `https://oauth.reddit.com/r/${subreddit}/comments/${postId}?sort=top&limit=10`;
      } else {
        url = `https://oauth.reddit.com/r/${subreddit}/top?t=${t}&limit=${limit}`;
      }

      // Fetch from Reddit API with OAuth
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "User-Agent": "netlify-reddit-proxy/1.0"
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
          body: JSON.stringify({ error: `Reddit API error: ${response.status} ${response.statusText}` })
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

    } else {
      // Fallback to Reddit JSON feed (no auth required)
      if (comments && postId) {
        url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?sort=top&limit=10`;
      } else {
        url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=${t}`;
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent": "netlify-reddit-proxy/1.0",
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
    }

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