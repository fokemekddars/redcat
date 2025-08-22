import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'RedditTopPostsApp/1.0 by YourUsername',
        'Accept': 'image/jpeg,image/png,image/gif,image/webp,*/*',
      }
    })

    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch image: ${response.status}` }, { status: response.status })
    }

    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Image download error:', error)
    return NextResponse.json({ error: 'Failed to download image' }, { status: 500 })
  }
}