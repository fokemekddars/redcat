"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, DownloadCloud, ExternalLink, MessageSquare, Heart, Plus, X, Copy, AlertTriangle, Clock, List } from "lucide-react"

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
  const [repostData, setRepostData] = useState<Map<string, RepostInfo>>(new Map())
  const [repostCheckLoading, setRepostCheckLoading] = useState<Set<string>>(new Set())

  const defaultSubreddits = ['meirl', 'me_irl', 'Meme', 'Memes', '2meirl4meirl', 'Sipstea']

  useEffect(() => {
    const saved = localStorage.getItem('customSubreddits')
    if (saved) {
      setCustomSubreddits(JSON.parse(saved))
    }
    
    // Load existing repost data
    const savedReposts = localStorage.getItem('repostRecords')
    if (savedReposts) {
      try {
        const records: RepostRecord[] = JSON.parse(savedReposts)
        loadRepostDataFromRecords(records)
      } catch (err) {
        console.error('Failed to load repost data:', err)
      }
    }
  }, [])

  // Queue system for repost checking
  const [repostQueue, setRepostQueue] = useState<RedditPost[]>([])
  const [isProcessingReposts, setIsProcessingReposts] = useState(false)
  
  // Effect to queue reposts when posts are loaded
  useEffect(() => {
    if (posts.length > 0) {
      // Only process first 10 posts initially to avoid overwhelming Reddit
      const postsToCheck = posts.slice(0, 10).filter(post => getImageUrl(post) !== null)
      setRepostQueue(postsToCheck)
    }
  }, [posts])
  
  // Process repost queue with proper rate limiting
  useEffect(() => {
    const processNextRepost = async () => {
      if (repostQueue.length > 0 && !isProcessingReposts) {
        setIsProcessingReposts(true)
        const currentPost = repostQueue[0]
        
        try {
          await checkForRepost(currentPost)
        } catch (err) {
          console.error('Repost check failed for post:', currentPost.id, err)
        }
        
        // Remove processed post and add delay before next one
        setTimeout(() => {
          setRepostQueue(prev => prev.slice(1))
          setIsProcessingReposts(false)
        }, 2000) // 2 second delay between checks to avoid rate limiting
      }
    }
    
    if (repostQueue.length > 0 && !isProcessingReposts) {
      processNextRepost()
    }
  }, [repostQueue, isProcessingReposts])

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
      // Use API route to proxy the image download to avoid CORS issues
      const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      
      if (!response.ok) {
        throw new Error(`Download failed: ${response.status}`)
      }
      
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
      alert('Download failed. The image might not be accessible.')
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

  // Hash comparison function (Hamming distance)
  const calculateHammingDistance = (hash1: string, hash2: string): number => {
    if (hash1.length !== hash2.length) return 100
    let distance = 0
    for (let i = 0; i < hash1.length; i++) {
      if (hash1[i] !== hash2[i]) distance++
    }
    return distance
  }

  // Calculate image hash using browser-image-hash with timeout and error handling
  const calculateImageHash = async (imageUrl: string): Promise<string | null> => {
    try {
      // Dynamically import browser-image-hash
      const { DifferenceHashBuilder } = await import('browser-image-hash')
      
      // Add timeout to prevent hanging on slow images
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Hash calculation timeout')), 30000)
      )
      
      const hashPromise = (async () => {
        try {
          const builder = new DifferenceHashBuilder()
          const hash = await builder.build(new URL(imageUrl))
          return hash.toString()
        } catch (err) {
          // Try with a proxy URL if direct access fails
          const proxyUrl = `/api/download?url=${encodeURIComponent(imageUrl)}`
          const builder = new DifferenceHashBuilder()
          const hash = await builder.build(new URL(proxyUrl, window.location.origin))
          return hash.toString()
        }
      })()
      
      return await Promise.race([hashPromise, timeoutPromise])
    } catch (err) {
      console.error('Hash calculation failed for URL:', imageUrl, err)
      return null
    }
  }

  // Load repost data from localStorage records
  const loadRepostDataFromRecords = (records: RepostRecord[]) => {
    const newRepostData = new Map<string, RepostInfo>()
    
    // Group records by hash to find reposts
    const hashGroups = new Map<string, RepostRecord[]>()
    records.forEach(record => {
      if (!hashGroups.has(record.imageHash)) {
        hashGroups.set(record.imageHash, [])
      }
      hashGroups.get(record.imageHash)!.push(record)
    })

    // Check for similar hashes using Hamming distance
    hashGroups.forEach((group, hash) => {
      group.forEach(record => {
        const similarRecords: RepostRecord[] = []
        
        // Check against all other hashes for similarity
        hashGroups.forEach((otherGroup, otherHash) => {
          if (hash !== otherHash && calculateHammingDistance(hash, otherHash) <= 5) {
            similarRecords.push(...otherGroup)
          }
        })

        // Include records with same exact hash (excluding self)
        const exactMatches = group.filter(r => r.id !== record.id)
        similarRecords.push(...exactMatches)

        const repostInfo: RepostInfo = {
          isRepost: similarRecords.length > 0,
          originalPosts: similarRecords.sort((a, b) => a.timestamp - b.timestamp),
          repostCount: similarRecords.length,
          similarity: similarRecords.length > 0 ? 95 : 0
        }

        newRepostData.set(record.id, repostInfo)
      })
    })
    
    setRepostData(newRepostData)
  }

  // Check if post is a repost with improved error handling
  const checkForRepost = async (post: RedditPost) => {
    const imageUrl = getImageUrl(post)
    if (!imageUrl) return

    setRepostCheckLoading(prev => new Set(prev).add(post.id))

    try {
      // Check if we already have this post in our records
      const savedRecords = localStorage.getItem('repostRecords')
      const existingRecords: RepostRecord[] = savedRecords ? JSON.parse(savedRecords) : []
      
      const existingRecord = existingRecords.find(record => record.id === post.id)
      if (existingRecord) {
        // Post already processed, just check for reposts
        const similarPosts: RepostRecord[] = []
        for (const record of existingRecords) {
          if (record.id !== post.id && calculateHammingDistance(existingRecord.imageHash, record.imageHash) <= 5) {
            similarPosts.push(record)
          }
        }
        
        const repostInfo: RepostInfo = {
          isRepost: similarPosts.length > 0,
          originalPosts: similarPosts.sort((a, b) => a.timestamp - b.timestamp),
          repostCount: similarPosts.length,
          similarity: similarPosts.length > 0 ? 95 : 0
        }
        
        setRepostData(prev => new Map(prev).set(post.id, repostInfo))
        return
      }

      const imageHash = await calculateImageHash(imageUrl)
      if (!imageHash) {
        console.warn(`Failed to hash image for post ${post.id}`)
        return
      }
      
      // Create new record
      const newRecord: RepostRecord = {
        id: post.id,
        imageUrl,
        imageHash,
        postTitle: post.title,
        subreddit: post.subreddit,
        author: post.author,
        permalink: post.permalink,
        timestamp: post.created_utc * 1000
      }

      // Check for reposts
      const similarPosts: RepostRecord[] = []
      for (const record of existingRecords) {
        if (record.id !== post.id) {
          const distance = calculateHammingDistance(imageHash, record.imageHash)
          if (distance <= 5) { // Similar images (threshold: 5 bits difference)
            similarPosts.push(record)
          }
        }
      }

      const repostInfo: RepostInfo = {
        isRepost: similarPosts.length > 0,
        originalPosts: similarPosts.sort((a, b) => a.timestamp - b.timestamp),
        repostCount: similarPosts.length,
        similarity: similarPosts.length > 0 ? Math.max(0, 100 - calculateHammingDistance(imageHash, similarPosts[0].imageHash) * 10) : 0
      }

      // Update repost data
      setRepostData(prev => new Map(prev).set(post.id, repostInfo))

      // Save new record to localStorage
      const updatedRecords = [...existingRecords, newRecord]
      localStorage.setItem('repostRecords', JSON.stringify(updatedRecords))

    } catch (err) {
      console.error('Repost check failed for post:', post.id, err)
      // Don't fail silently, but don't block the UI either
    } finally {
      setRepostCheckLoading(prev => {
        const newSet = new Set(prev)
        newSet.delete(post.id)
        return newSet
      })
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
              {repostQueue.length > 0 && (
                <Badge variant="outline" className="text-lg py-2 px-4 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  Checking reposts ({repostQueue.length} remaining)
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {repostQueue.length === 0 && posts.length > 10 && (
                <Button 
                  onClick={() => {
                    const remainingPosts = posts.slice(10).filter(post => getImageUrl(post) !== null)
                    setRepostQueue(prev => [...prev, ...remainingPosts])
                  }}
                  variant="ghost" 
                  size="sm"
                  className="text-xs"
                >
                  Check More Reposts
                </Button>
              )}
              {postsWithImages.length > 0 && (
                <Button onClick={downloadAllImages} variant="outline" className="flex items-center gap-2">
                  <DownloadCloud className="h-4 w-4" />
                  Download All Images ({postsWithImages.length})
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post) => {
            const imageUrl = getImageUrl(post)
            const repostInfo = repostData.get(post.id)
            const isChecking = repostCheckLoading.has(post.id)
            const isRepost = repostInfo?.isRepost || false
            
            return (
              <Card 
                key={post.id} 
                className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
                  isRepost ? 'bg-red-50 border-red-200 shadow-red-100' : ''
                }`}
                onClick={() => handlePostClick(post)}
              >
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
                    
                    {/* Repost indicator */}
                    {isRepost && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        REPOST
                      </div>
                    )}
                    
                    {/* Checking indicator */}
                    {isChecking && (
                      <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Checking...
                      </div>
                    )}
                  </div>
                )}
                
                <CardContent className={`p-4 ${isRepost ? 'bg-red-50' : ''}`}>
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight">
                    {post.title}
                  </h3>
                  
                  {/* Repost info display */}
                  {isRepost && repostInfo && (
                    <div className="mb-3 p-2 bg-red-100 rounded-lg border border-red-200">
                      <div className="flex items-center gap-2 text-xs text-red-700 mb-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="font-medium">
                          Reposted {repostInfo.repostCount} time{repostInfo.repostCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {repostInfo.repostCount >= 5 ? (
                        <div className="text-xs text-red-600">
                          <List className="h-3 w-3 inline mr-1" />
                          Multiple reposts detected - click to see list
                        </div>
                      ) : repostInfo.originalPosts.length > 0 && (
                        <div className="text-xs text-red-600">
                          <Clock className="h-3 w-3 inline mr-1" />
                          First posted {new Date(repostInfo.originalPosts[0].timestamp).toLocaleDateString()} 
                          in r/{repostInfo.originalPosts[0].subreddit}
                        </div>
                      )}
                    </div>
                  )}
                  
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
                
                {/* Repost Information Section */}
                {selectedPost && repostData.get(selectedPost.id)?.isRepost && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h4 className="font-semibold text-red-700">Repost Detected</h4>
                    </div>
                    
                    {(() => {
                      const repostInfo = repostData.get(selectedPost.id)!
                      return (
                        <>
                          <p className="text-sm text-red-600 mb-3">
                            This image has been posted {repostInfo.repostCount} time{repostInfo.repostCount !== 1 ? 's' : ''} before
                            {repostInfo.similarity && ` with ${Math.round(repostInfo.similarity)}% similarity`}.
                          </p>
                          
                          {repostInfo.repostCount >= 5 ? (
                            <div className="space-y-2">
                              <h5 className="font-medium text-red-700 flex items-center gap-1">
                                <List className="h-4 w-4" />
                                Previous Posts ({repostInfo.originalPosts.length}):
                              </h5>
                              <div className="max-h-32 overflow-y-auto space-y-2">
                                {repostInfo.originalPosts.map((originalPost, index) => (
                                  <div key={index} className="bg-white p-2 rounded border text-xs">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-medium">r/{originalPost.subreddit}</span>
                                      <span className="text-gray-500">
                                        {new Date(originalPost.timestamp).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className="text-gray-600 line-clamp-1" title={originalPost.postTitle}>
                                      {originalPost.postTitle}
                                    </p>
                                    <p className="text-gray-500">by u/{originalPost.author}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : repostInfo.originalPosts.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-red-700">Original Post:</h5>
                              {repostInfo.originalPosts.map((originalPost, index) => (
                                <div key={index} className="bg-white p-3 rounded border">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <Clock className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm font-medium">r/{originalPost.subreddit}</span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                      {new Date(originalPost.timestamp).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mb-1">{originalPost.postTitle}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500">by u/{originalPost.author}</span>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-xs"
                                      onClick={() => window.open(`https://reddit.com${originalPost.permalink}`, '_blank')}
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      View Original
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}
                
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