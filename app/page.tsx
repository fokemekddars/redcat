"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, DownloadCloud, ExternalLink, MessageSquare, Heart } from "lucide-react"

interface RedditPost {
  id: string
  title: string
  url: string
  permalink: string
  author: string
  score: number
  num_comments: number
  created_utc: number
  subreddit: string
  thumbnail?: string
  preview?: {
    images: Array<{
      source: {
        url: string
        width: number
        height: number
      }
    }>
  }
  url_overridden_by_dest?: string
}

export default function Home() {
  const [subreddit, setSubreddit] = useState("")
  const [timePeriod, setTimePeriod] = useState("week")
  const [postLimit, setPostLimit] = useState("100")
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const fetchRedditPosts = async () => {
    if (!subreddit.trim()) {
      setError("Please enter a subreddit name")
      return
    }

    setLoading(true)
    setError("")
    setPosts([])

    try {
      const limit = Math.min(parseInt(postLimit), 100)
      const url = `/api/reddit?subreddit=${encodeURIComponent(subreddit)}&limit=${limit}&t=${timePeriod}`
      
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.data && data.data.children) {
        const fetchedPosts = data.data.children
          .map((child: any) => child.data)
          .filter((post: any) => post.url && !post.is_self)
        
        setPosts(fetchedPosts)
      } else {
        setError("No posts found or subreddit doesn't exist")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch posts")
    } finally {
      setLoading(false)
    }
  }

  const getImageUrl = (post: RedditPost): string | null => {
    if (post.preview?.images?.[0]?.source?.url) {
      return post.preview.images[0].source.url.replace(/&amp;/g, '&')
    }
    
    if (post.url && (post.url.includes('.jpg') || post.url.includes('.png') || post.url.includes('.gif') || post.url.includes('.jpeg'))) {
      return post.url
    }

    if (post.thumbnail && post.thumbnail !== 'default' && post.thumbnail !== 'self') {
      return post.thumbnail
    }

    return null
  }

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download failed:', err)
    }
  }

  const downloadAllImages = async () => {
    const imageUrls = posts
      .map(post => ({ url: getImageUrl(post), title: post.title, id: post.id }))
      .filter(item => item.url !== null) as Array<{ url: string; title: string; id: string }>

    for (const { url, title, id } of imageUrls) {
      const filename = `${subreddit}_${id}_${title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.jpg`
      await downloadImage(url, filename)
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  const postsWithImages = posts.filter(post => getImageUrl(post) !== null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Reddit Top Posts Explorer</h1>
          <p className="text-gray-600">Discover and download top images from any subreddit</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subreddit</label>
                <Input
                  placeholder="e.g. earthporn, pics, photography"
                  value={subreddit}
                  onChange={(e) => setSubreddit(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchRedditPosts()}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Time Period</label>
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hour">Today</SelectItem>
                    <SelectItem value="day">This Day</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="year">This Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Post Limit</label>
                <Select value={postLimit} onValueChange={setPostLimit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">Top 25</SelectItem>
                    <SelectItem value="50">Top 50</SelectItem>
                    <SelectItem value="100">Top 100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col justify-end">
                <Button 
                  onClick={fetchRedditPosts} 
                  disabled={loading || !subreddit.trim()}
                  className="w-full"
                >
                  {loading ? "Fetching..." : "Fetch Posts"}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm mt-2 p-3 bg-red-50 rounded-lg">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {posts.length > 0 && (
          <div className="mb-6 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-lg py-2 px-4">
                {posts.length} posts found
              </Badge>
              <Badge variant="outline" className="text-lg py-2 px-4">
                {postsWithImages.length} with images
              </Badge>
            </div>
            
            {postsWithImages.length > 0 && (
              <Button onClick={downloadAllImages} variant="outline" className="flex items-center gap-2">
                <DownloadCloud className="h-4 w-4" />
                Download All Images ({postsWithImages.length})
              </Button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post) => {
            const imageUrl = getImageUrl(post)
            
            return (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {imageUrl && (
                  <div className="relative">
                    <img 
                      src={imageUrl} 
                      alt={post.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute top-2 right-2 opacity-80 hover:opacity-100"
                      onClick={() => downloadImage(imageUrl, `${post.id}_${post.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.jpg`)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight">
                    {post.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>u/{post.author}</span>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.score}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post.num_comments}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1 text-xs"
                      onClick={() => window.open(`https://reddit.com${post.permalink}`, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Post
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Fetching posts from r/{subreddit}...</p>
          </div>
        )}
      </div>
    </div>
  )
}
