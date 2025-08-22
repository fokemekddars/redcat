"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, DownloadCloud, ExternalLink, MessageSquare, Heart, Plus, X, Copy } from "lucide-react"

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
  selftext?: string
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

interface RedditComment {
  id: string
  body: string
  author: string
  score: number
  created_utc: number
  replies?: {
    data: {
      children: Array<{ data: RedditComment }>
    }
  }
}

export default function Home() {
  const [subreddit, setSubreddit] = useState("")
  const [customSubreddits, setCustomSubreddits] = useState<string[]>([])
  const [showAddSubreddit, setShowAddSubreddit] = useState(false)
  const [newSubreddit, setNewSubreddit] = useState("")
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null)
  const [postComments, setPostComments] = useState<RedditComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [timePeriod, setTimePeriod] = useState("week")
  const [postLimit, setPostLimit] = useState("100")
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const defaultSubreddits = ['meirl', 'me_irl', 'Meme', 'Memes', '2meirl4meirl', 'Sipstea']

  useEffect(() => {
    const saved = localStorage.getItem('customSubreddits')
    if (saved) {
      setCustomSubreddits(JSON.parse(saved))
    }
  }, [])

  const saveCustomSubreddits = (subs: string[]) => {
    setCustomSubreddits(subs)
    localStorage.setItem('customSubreddits', JSON.stringify(subs))
  }

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
          .filter((post: any) => post.url)
        
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

  const fetchPostComments = async (postId: string, subredditName: string) => {
    setCommentsLoading(true)
    try {
      const url = `/api/reddit?subreddit=${subredditName}&postId=${postId}&comments=true`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch comments: ${response.status}`)
      }

      const data = await response.json()
      if (data.length > 1 && data[1].data?.children) {
        const comments = data[1].data.children
          .map((child: any) => child.data)
          .filter((comment: any) => comment.body && comment.body !== '[deleted]' && comment.body !== '[removed]')
          .slice(0, 10)
        
        setPostComments(comments)
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err)
      setPostComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  const addCustomSubreddit = () => {
    if (newSubreddit.trim() && !defaultSubreddits.includes(newSubreddit.trim()) && !customSubreddits.includes(newSubreddit.trim())) {
      const updatedSubs = [...customSubreddits, newSubreddit.trim()]
      saveCustomSubreddits(updatedSubs)
      setNewSubreddit("")
      setShowAddSubreddit(false)
    }
  }

  const removeCustomSubreddit = (subToRemove: string) => {
    const updatedSubs = customSubreddits.filter(sub => sub !== subToRemove)
    saveCustomSubreddits(updatedSubs)
  }

  const handlePostClick = (post: RedditPost) => {
    setSelectedPost(post)
    fetchPostComments(post.id, post.subreddit)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Copied to clipboard')
    })
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
                <div className="flex gap-2 mb-2">
                  <Select value={subreddit} onValueChange={setSubreddit}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select frequently used" />
                    </SelectTrigger>
                    <SelectContent>
                      {defaultSubreddits.map(sub => (
                        <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                      ))}
                      {customSubreddits.map(sub => (
                        <SelectItem key={`custom-${sub}`} value={sub}>{sub}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAddSubreddit(true)}
                    className="px-3"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="Or type custom subreddit name"
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
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handlePostClick(post)}>
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
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadImage(imageUrl, `${post.id}_${post.title.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '_')}.jpg`)
                      }}
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
                      onClick={(e) => {
                        e.stopPropagation()
                        window.open(`https://reddit.com${post.permalink}`, '_blank')
                      }}
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

        {/* Add Subreddit Dialog */}
        <Dialog open={showAddSubreddit} onOpenChange={setShowAddSubreddit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Custom Subreddit</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Enter subreddit name (without r/)"
                value={newSubreddit}
                onChange={(e) => setNewSubreddit(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addCustomSubreddit()}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowAddSubreddit(false)}>
                  Cancel
                </Button>
                <Button onClick={addCustomSubreddit} disabled={!newSubreddit.trim()}>
                  Add
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Post Details Modal */}
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            {selectedPost && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-left">{selectedPost.title}</DialogTitle>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>by u/{selectedPost.author} in r/{selectedPost.subreddit}</span>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        {selectedPost.score}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {selectedPost.num_comments}
                      </span>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="space-y-4">
                  {getImageUrl(selectedPost) && (
                    <div className="relative">
                      <img 
                        src={getImageUrl(selectedPost)!} 
                        alt={selectedPost.title}
                        className="w-full max-h-96 object-contain rounded-lg"
                      />
                    </div>
                  )}
                  
                  {selectedPost.selftext && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Post Content</h4>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(selectedPost.selftext!)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="whitespace-pre-wrap">{selectedPost.selftext}</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Top Comments ({postComments.length})</h4>
                      {postComments.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const commentsText = postComments.map((comment, i) => 
                              `${i + 1}. u/${comment.author} (${comment.score} points):\n${comment.body}\n`
                            ).join('\n')
                            copyToClipboard(commentsText)
                          }}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy All
                        </Button>
                      )}
                    </div>
                    
                    {commentsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span className="ml-2">Loading comments...</span>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {postComments.map((comment, index) => (
                          <div key={comment.id} className="bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span className="font-medium">#{index + 1}</span>
                                <span>u/{comment.author}</span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {comment.score}
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(comment.body)}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                          </div>
                        ))}
                        
                        {postComments.length === 0 && !commentsLoading && (
                          <p className="text-center text-gray-500 py-4">No comments found</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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