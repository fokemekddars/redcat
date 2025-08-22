# Reddit Top Posts Explorer

A modern web application built with Next.js 14 that allows you to explore and download top posts from any Reddit subreddit. No authentication required - uses Reddit's public JSON feeds.

## Features

🔍 **Subreddit Search** - Enter any public subreddit name to explore  
⭐ **Personalized Subreddit Dropdown** - Quick access to frequently used subreddits (meirl, me_irl, Meme, Memes, 2meirl4meirl, Sipstea)  
➕ **Custom Subreddit Management** - Add your own favorite subreddits with the + button and remove them when needed  
💾 **Persistent Preferences** - Your custom subreddit list is saved in localStorage  
⏰ **Time Period Filtering** - Choose from Today, This Week, This Month, This Year, or All Time  
📊 **Post Limits** - Select between top 25, 50, or 100 posts  
🖼️ **Image Display** - Beautiful card-based layout showing post images  
🔍 **Post Modal View** - Click any post card to view full content in an elegant modal  
💬 **Top Comments Display** - View top 10 comments for any post with scores and author info  
📋 **Copy Functionality** - Copy individual comments, all comments, or post content to clipboard  
⬇️ **Individual Downloads** - Download any image with a single click  
📦 **Bulk Downloads** - Download all images from the results at once  
📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices  
⚡ **Fast Loading** - Optimized performance with loading states and error handling  
🚨 **Repost Detection** - Advanced image hashing to detect when images have been reposted  
🔴 **Visual Repost Indicators** - Post cards turn red and show warning badges for detected reposts  
📅 **Repost History** - Click repost cards to see detailed history including original post dates and subreddits  
📊 **Smart Detection** - Uses dHash algorithm for fast and accurate similar image detection  
💾 **Persistent Tracking** - Repost data is stored locally to build detection accuracy over time  

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **Lucide React** - Modern icon library
- **browser-image-hash** - Client-side image hashing for repost detection

## Repost Detection System

### Advanced Image Hashing Technology

The application includes sophisticated repost detection inspired by RepostSleuthBot, using client-side image hashing to identify when images have been posted before.

**Key Features:**
- **dHash Algorithm** - Uses difference hashing for fast and accurate image comparison
- **Hamming Distance** - Measures similarity between images with 5-bit threshold for detection
- **Real-time Processing** - Images are hashed and checked automatically when posts load
- **Visual Indicators** - Reposts are highlighted with red backgrounds and warning badges
- **Detailed History** - Click on repost cards to see complete posting history

**How It Works:**
1. Each image is processed using the dHash (difference hash) algorithm
2. Hash values are stored locally in browser storage
3. New images are compared against existing hashes using Hamming distance
4. Images with ≤5 bits difference are considered similar/reposts
5. Repost information includes original post dates, subreddits, and authors

**Smart Detection:**
- Handles multiple reposts (5+ shows as list view)
- Tracks posting history across subreddits
- Persistent storage builds accuracy over time
- Works entirely offline after initial image processing

## Reddit API Integration

### Approach Used: Reddit JSON Feed (No Authentication)

This application uses Reddit's public JSON feeds, which provide several advantages:

✅ **No Authentication Required** - No API keys or OAuth setup needed  
✅ **Simple Implementation** - Direct HTTP requests to public endpoints  
✅ **Rate Limits** - 100 requests per minute (sufficient for personal use)  
✅ **Public Subreddits** - Works with all public subreddits  

### API Endpoint Format
```
https://www.reddit.com/r/{subreddit}/top.json?limit={count}&t={timeframe}
```

**Parameters:**
- `subreddit` - The subreddit name (e.g., "earthporn", "pics")
- `limit` - Number of posts (up to 100)
- `t` - Time frame: hour, day, week, month, year, all

### Alternative: Official Reddit API

For production applications requiring higher rate limits or access to private subreddits, you could use Reddit's official API which requires:
- OAuth 2.0 authentication
- Client ID and Client Secret
- User account credentials
- Higher rate limits (but more complex setup)

## How to Use

1. **Select Subreddit** - Choose from the dropdown of frequently used subreddits or type a custom one
2. **Add Custom Subreddits** - Click the + button to add your favorite subreddits for quick access
3. **Select Time Period** - Choose from Today, Week, Month, Year, or All Time
4. **Choose Post Limit** - Select how many top posts to fetch (25, 50, or 100)
5. **Click Fetch Posts** - The app will load the top posts with images
6. **View Post Details** - Click any post card to open a modal with full content and top 10 comments
7. **Copy Content** - Use copy buttons to copy post content or comments to your clipboard
8. **Download Images** - Use individual download buttons or bulk download all

## Popular Subreddits to Try

- **Photography**: earthporn, pics, photography, itookapicture
- **Art & Design**: art, designporn, imaginarylandscapes
- **Animals**: aww, animalsbeingbros, natureismetal
- **Space**: spaceporn, astronomy, astrophotography
- **Architecture**: architectureporn, roomporn, cozyplaces

## Project Structure

```
├── app/
│   ├── api/reddit/route.ts    # API proxy for Reddit requests
│   ├── page.tsx               # Main application component
│   ├── layout.tsx             # App layout
│   └── globals.css            # Global styles
├── components/ui/             # shadcn/ui components
└── lib/                       # Utility functions
```

## Technical Implementation Details

- **CORS Handling** - Internal API route proxies Reddit requests to avoid CORS issues
- **Image Processing** - Handles multiple Reddit image formats and preview URLs  
- **Download Mechanism** - Proxied downloads via `/api/download` endpoint to avoid CORS issues
- **Repost Detection Rate Limiting** - Intelligent queue system processes only 10 posts initially with 2-second delays between checks
- **Error Handling** - Comprehensive error states and user feedback with timeout handling
- **Loading States** - Smooth loading indicators and skeleton states

## Development

To run the development server:

```bash
bun install
bun run dev
```

To build for production:

```bash
bun run build
```

## Environment

No environment variables required for basic functionality. The app works out of the box with Reddit's public JSON feeds.

## Limitations

- Limited to 100 posts per request (Reddit's JSON feed limit)
- Only works with public subreddits
- Rate limited to 100 requests per minute
- Some images may not be accessible due to Reddit's content policies

## Future Enhancements

- Add support for video downloads
- Implement post filtering by score/comments
- Add favorites/bookmarking functionality
- Support for multiple subreddit searches
- Enhanced image preview modal