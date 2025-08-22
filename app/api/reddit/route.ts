import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const subreddit = searchParams.get('subreddit')
  const postId = searchParams.get('postId')
  const comments = searchParams.get('comments')
  const timePeriod = searchParams.get('t') || 'week'
  const limit = searchParams.get('limit') || '100'

  if (!subreddit) {
    return NextResponse.json({ error: 'Subreddit parameter is required' }, { status: 400 })
  }

  try {
    let url: string

    if (comments && postId) {
      // Fetch comments for a specific post
      url = `https://www.reddit.com/r/${subreddit}/comments/${postId}.json?sort=top&limit=10`
    } else {
      // Fetch top posts
      url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=${timePeriod}`
    }
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RedditTopPostsApp/1.0 by YourUsername',
        'Accept': 'application/json',
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Reddit API error: ${response.status}` }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Reddit API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Reddit data' }, { status: 500 })
  }
}