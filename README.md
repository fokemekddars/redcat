# Reddit Top Posts Explorer

A modern web application built with Next.js 14 that allows you to explore and download top posts from any Reddit subreddit. No authentication required - uses Reddit's public JSON feeds.

## Features

🔍 **Subreddit Search** - Enter any public subreddit name to explore  
⏰ **Time Period Filtering** - Choose from Today, This Week, This Month, This Year, or All Time  
📊 **Post Limits** - Select between top 25, 50, or 100 posts  
🖼️ **Image Display** - Beautiful card-based layout showing post images  
⬇️ **Individual Downloads** - Download any image with a single click  
📦 **Bulk Downloads** - Download all images from the results at once  
📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile devices  
⚡ **Fast Loading** - Optimized performance with loading states and error handling  

## Technology Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern utility-first CSS framework
- **shadcn/ui** - Beautiful, accessible component library
- **Lucide React** - Modern icon library

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

1. **Enter Subreddit Name** - Type the name of any public subreddit (without the "r/" prefix)
2. **Select Time Period** - Choose from Today, Week, Month, Year, or All Time
3. **Choose Post Limit** - Select how many top posts to fetch (25, 50, or 100)
4. **Click Fetch Posts** - The app will load the top posts with images
5. **Download Images** - Use individual download buttons or bulk download all

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
- **Download Mechanism** - Client-side downloads using Blob URLs
- **Error Handling** - Comprehensive error states and user feedback
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