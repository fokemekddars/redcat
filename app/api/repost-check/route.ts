import { NextRequest, NextResponse } from 'next/server'

interface RepostRecord {
  id: string
  imageUrl: string
  imageHash: string
  postTitle: string
  subreddit: string
  author: string
  permalink: string
  timestamp: number
}

interface RepostInfo {
  isRepost: boolean
  originalPosts: RepostRecord[]
  repostCount: number
  similarity?: number
}

export async function POST(request: NextRequest) {
  try {
    const { imageHash, imageUrl, postId, postTitle, subreddit, author, permalink } = await request.json()

    if (!imageHash || !imageUrl || !postId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    // Get existing repost records from localStorage simulation (we'll handle this on client-side)
    // This endpoint will be called to store and check repost data
    
    const repostRecord: RepostRecord = {
      id: postId,
      imageUrl,
      imageHash,
      postTitle: postTitle || '',
      subreddit: subreddit || '',
      author: author || '',
      permalink: permalink || '',
      timestamp: Date.now()
    }

    // For now, return the record to be handled on client-side
    // In a real implementation, this would check against a database
    return NextResponse.json({ 
      success: true, 
      record: repostRecord,
      message: 'Repost record processed'
    })

  } catch (error) {
    console.error('Repost check error:', error)
    return NextResponse.json({ error: 'Failed to process repost check' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const imageHash = searchParams.get('imageHash')
  
  if (!imageHash) {
    return NextResponse.json({ error: 'Image hash parameter is required' }, { status: 400 })
  }

  try {
    // This would normally check against a database
    // For now, return empty result - client will handle localStorage logic
    const repostInfo: RepostInfo = {
      isRepost: false,
      originalPosts: [],
      repostCount: 0
    }

    return NextResponse.json(repostInfo)
  } catch (error) {
    console.error('Repost lookup error:', error)
    return NextResponse.json({ error: 'Failed to lookup repost data' }, { status: 500 })
  }
}