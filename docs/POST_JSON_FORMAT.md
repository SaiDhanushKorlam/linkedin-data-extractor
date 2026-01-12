# LinkedIn Post Extraction - Comprehensive JSON Format

## Overview

The LinkedIn Data Extractor now supports **comprehensive JSON format** for post content extraction. This provides detailed, structured data for each LinkedIn post including metadata, content analysis, engagement metrics, media information, topics, and classification.

## 📊 JSON Structure

### Complete Post Object

```json
{
  "metadata": {
    "post_url": "https://www.linkedin.com/posts/...",
    "post_id": "7405356028634050561",
    "author_name": "Bill Gates",
    "author_profile_url": "https://www.linkedin.com/in/williamhgates",
    "posted_date": "1 day ago",
    "extraction_timestamp": "2026-01-12T11:20:00.000Z"
  },
  "content": {
    "full_text": "Complete post text content...",
    "summary": "Brief summary of the post...",
    "content_type": "text|video|image|article|poll",
    "language": "en",
    "word_count": 45,
    "character_count": 273
  },
  "engagement": {
    "likes": 1033,
    "comments": 173,
    "shares": 25,
    "views": 15000,
    "engagement_rate": "8.2%"
  },
  "media": {
    "has_media": true,
    "media_type": "image|video|document|none",
    "media_urls": ["https://..."],
    "image_count": 1,
    "video_count": 0
  },
  "topics": {
    "hashtags": ["#AI", "#Technology"],
    "mentions": ["@username"],
    "links": ["https://example.com"],
    "topics": ["technology", "business", "leadership"],
    "keywords": ["innovation", "growth", "strategy"]
  },
  "classification": {
    "post_type": "recommendation|announcement|question|promotional|general_update",
    "sentiment": "positive|negative|neutral",
    "category": "thought_leadership|company_news|personal_story|industry_news|engagement",
    "is_promotional": false,
    "is_question": false
  },
  "raw_data": {
    "raw_text": "Original unprocessed text...",
    "source": "Exa AI"
  }
}
```

## 🎯 Field Descriptions

### Metadata
- **post_url**: Direct link to the LinkedIn post
- **post_id**: Unique LinkedIn activity ID
- **author_name**: Name of the post author
- **author_profile_url**: LinkedIn profile URL of the author
- **posted_date**: When the post was published (relative or absolute)
- **extraction_timestamp**: When the data was extracted (ISO 8601)

### Content
- **full_text**: Complete post text content (up to 2000 characters)
- **summary**: Brief summary (first 200 characters)
- **content_type**: Type of content (text, video, image, article, poll)
- **language**: Detected language code (e.g., "en", "es", "fr")
- **word_count**: Number of words in the post
- **character_count**: Total character count

### Engagement
- **likes**: Number of likes/reactions
- **comments**: Number of comments
- **shares**: Number of shares/reposts
- **views**: Number of post views (if available)
- **engagement_rate**: Calculated engagement percentage

### Media
- **has_media**: Boolean indicating media presence
- **media_type**: Type of media (image, video, document, none)
- **media_urls**: Array of media URLs
- **image_count**: Number of images
- **video_count**: Number of videos

### Topics
- **hashtags**: Array of hashtags used in the post
- **mentions**: Array of @mentions
- **links**: Array of external links
- **topics**: Detected topics/themes
- **keywords**: Extracted important keywords

### Classification
- **post_type**: Classified post type
  - `recommendation`: Product/book/service recommendations
  - `announcement`: Company or personal announcements
  - `question`: Posts asking for input/feedback
  - `promotional`: Marketing/sales content
  - `general_update`: Regular status updates
  - `job_posting`: Job opportunities
  - `article_share`: Shared articles/blogs

- **sentiment**: Overall sentiment analysis
  - `positive`: Optimistic, enthusiastic tone
  - `negative`: Critical, disappointed tone
  - `neutral`: Balanced, informational tone

- **category**: Content category
  - `thought_leadership`: Insights and perspectives
  - `company_news`: Business updates
  - `personal_story`: Personal experiences
  - `industry_news`: Market/industry updates
  - `engagement`: Community engagement posts

- **is_promotional**: Boolean flag for promotional content
- **is_question**: Boolean flag for question posts

### Raw Data
- **raw_text**: Original unprocessed text from source
- **source**: Data source (e.g., "Exa AI")

## 🚀 API Usage

### Extract Posts with Detailed JSON

**Endpoint**: `POST /webhook/posts-detailed`

**Request Body**:
```json
{
  "url": "https://linkedin.com/in/williamhgates",
  "secret": "your_webhook_secret",
  "max_posts": 20
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "profile_url": "https://linkedin.com/in/williamhgates",
    "total_posts": 20,
    "posts": [
      {
        "metadata": { ... },
        "content": { ... },
        "engagement": { ... },
        "media": { ... },
        "topics": { ... },
        "classification": { ... },
        "raw_data": { ... }
      }
    ]
  }
}
```

### cURL Example

```bash
curl -X POST https://linkedin-data-extractor-production.up.railway.app/webhook/posts-detailed \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://linkedin.com/in/williamhgates",
    "secret": "your_webhook_secret",
    "max_posts": 10
  }'
```

## 📊 Google Sheets Integration

### Posts JSON Detailed Sheet

The extracted data is stored in the **"Posts JSON Detailed"** sheet with the following columns:

| Column | Description |
|--------|-------------|
| Post URL | Direct link to the post |
| Author | Post author name |
| Full JSON Data | Complete JSON object |
| Metadata JSON | Metadata section only |
| Content JSON | Content section only |
| Engagement JSON | Engagement metrics only |
| Media JSON | Media information only |
| Topics JSON | Topics and keywords only |
| Classification JSON | Classification data only |
| Extraction Date | When data was extracted |

### Accessing the Data

**Spreadsheet URL**: https://docs.google.com/spreadsheets/d/1MPZm4Ya91MJhyAaArXKiw-i18pFjxaVNrvfjbuB9bjg/edit

**Direct Sheet Link**: [Posts JSON Detailed](https://docs.google.com/spreadsheets/d/1MPZm4Ya91MJhyAaArXKiw-i18pFjxaVNrvfjbuB9bjg/edit#gid=569884863)

## 💡 Use Cases

### 1. Content Analysis
- Analyze post performance by content type
- Identify high-engagement topics
- Track sentiment trends over time

### 2. Competitive Intelligence
- Monitor competitor posting strategies
- Analyze engagement patterns
- Identify successful content formats

### 3. Influencer Research
- Track influencer content themes
- Measure engagement rates
- Identify collaboration opportunities

### 4. Marketing Insights
- Discover trending topics in your industry
- Optimize posting times and formats
- Benchmark against industry leaders

### 5. Data Science & ML
- Train sentiment analysis models
- Build recommendation systems
- Predict post performance

## 🔧 Advanced Features

### Filtering by Post Type

```bash
# Extract only questions
curl -X POST .../webhook/posts-detailed \
  -d '{"url": "...", "filter": {"post_type": "question"}}'

# Extract only promotional content
curl -X POST .../webhook/posts-detailed \
  -d '{"url": "...", "filter": {"is_promotional": true}}'
```

### Sentiment Analysis

```bash
# Extract only positive posts
curl -X POST .../webhook/posts-detailed \
  -d '{"url": "...", "filter": {"sentiment": "positive"}}'
```

### Date Range Filtering

```bash
# Extract posts from last 30 days
curl -X POST .../webhook/posts-detailed \
  -d '{"url": "...", "date_range": {"days": 30}}'
```

## 📈 Analytics Examples

### Calculate Average Engagement Rate

```javascript
const posts = extractedData.posts;
const avgEngagement = posts.reduce((sum, post) => 
  sum + parseFloat(post.engagement.engagement_rate), 0
) / posts.length;
```

### Find Most Popular Topics

```javascript
const topicCounts = {};
posts.forEach(post => {
  post.topics.topics.forEach(topic => {
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });
});
```

### Identify Best Performing Content Type

```javascript
const typePerformance = {};
posts.forEach(post => {
  const type = post.content.content_type;
  if (!typePerformance[type]) {
    typePerformance[type] = { total: 0, count: 0 };
  }
  typePerformance[type].total += post.engagement.likes;
  typePerformance[type].count += 1;
});
```

## 🛠️ Implementation Details

### Module Location
`lib/postExtractor.js`

### Dependencies
- axios (HTTP requests)
- Exa AI API (data extraction)

### Rate Limiting
- Default: 10 requests per minute
- Configurable via `RATE_LIMIT` environment variable

### Error Handling
- Automatic retries (3 attempts)
- Graceful degradation for missing data
- Detailed error logging

## 📝 Notes

- **Data Accuracy**: Extraction accuracy depends on LinkedIn's public data availability
- **Rate Limits**: Respect LinkedIn's rate limits and terms of service
- **Privacy**: Only extract publicly available data
- **Updates**: Post engagement metrics may change over time

## 🤝 Support

For issues or questions:
- GitHub Issues: [linkedin-data-extractor/issues](https://github.com/SaiDhanushKorlam/linkedin-data-extractor/issues)
- Email: saidhanushk@panlys.com

## 📄 License

MIT License - See LICENSE file for details

---

**Last Updated**: 2026-01-12
**Version**: 1.1.0
