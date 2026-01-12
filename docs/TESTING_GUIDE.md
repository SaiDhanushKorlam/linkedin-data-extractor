# Testing the LinkedIn Data Extractor with JSON Post Extraction

## 🎉 Integration Complete!

The comprehensive JSON post extractor has been successfully integrated into the main webhook service at:
**https://linkedin-data-extractor-production.up.railway.app**

Railway is automatically deploying the updated code (v1.1.0).

---

## 🚀 New Endpoint: `/webhook/posts-detailed`

### Request Format

```bash
curl -X POST https://linkedin-data-extractor-production.up.railway.app/webhook/posts-detailed \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.linkedin.com/in/rvss-prasad-39a2a413",
    "secret": "your_secure_random_string_here",
    "max_posts": 20
  }'
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | ✅ Yes | LinkedIn profile URL |
| `secret` | string | ✅ Yes | Your webhook secret |
| `max_posts` | number | ❌ No | Maximum posts to extract (default: 20) |

---

## 📊 Response Format

```json
{
  "success": true,
  "data": {
    "profile_url": "https://www.linkedin.com/in/rvss-prasad-39a2a413",
    "total_posts": 15,
    "posts": [
      {
        "metadata": {
          "post_url": "https://linkedin.com/posts/...",
          "post_id": "7405356028634050561",
          "author_name": "RVSS Prasad",
          "author_profile_url": "https://www.linkedin.com/in/rvss-prasad-39a2a413",
          "posted_date": "2 days ago",
          "extraction_timestamp": "2026-01-12T11:45:00.000Z"
        },
        "content": {
          "full_text": "Complete post content...",
          "summary": "Brief summary...",
          "content_type": "text",
          "language": "en",
          "word_count": 125,
          "character_count": 650
        },
        "engagement": {
          "likes": 45,
          "comments": 12,
          "shares": 3,
          "views": 1200,
          "engagement_rate": "5.0%"
        },
        "media": {
          "has_media": true,
          "media_type": "image",
          "media_urls": ["https://..."],
          "image_count": 1,
          "video_count": 0
        },
        "topics": {
          "hashtags": ["#AI", "#Technology"],
          "mentions": ["@username"],
          "links": ["https://example.com"],
          "topics": ["technology", "business"],
          "keywords": ["innovation", "growth"]
        },
        "classification": {
          "post_type": "general_update",
          "sentiment": "positive",
          "category": "thought_leadership",
          "is_promotional": false,
          "is_question": false
        },
        "raw_data": {
          "raw_text": "Original text...",
          "source": "Exa AI"
        }
      }
    ]
  }
}
```

---

## 🧪 Testing Instructions

### Step 1: Wait for Railway Deployment

Railway is currently auto-deploying the updated code. This usually takes 2-3 minutes.

**Check deployment status:**
```bash
curl https://linkedin-data-extractor-production.up.railway.app/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "version": "1.1.0",
  "features": ["profile_extraction", "posts_json_detailed", "extract_all"]
}
```

### Step 2: Test Profile Extraction

```bash
curl -X POST https://linkedin-data-extractor-production.up.railway.app/webhook/profile \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.linkedin.com/in/rvss-prasad-39a2a413",
    "secret": "your_secure_random_string_here"
  }'
```

### Step 3: Test JSON Post Extraction

```bash
curl -X POST https://linkedin-data-extractor-production.up.railway.app/webhook/posts-detailed \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.linkedin.com/in/rvss-prasad-39a2a413",
    "secret": "your_secure_random_string_here",
    "max_posts": 20
  }'
```

### Step 4: Test Extract All (Profile + Posts)

```bash
curl -X POST https://linkedin-data-extractor-production.up.railway.app/webhook/extract-all \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.linkedin.com/in/rvss-prasad-39a2a413",
    "secret": "your_secure_random_string_here",
    "includeProfile": true,
    "includePosts": true,
    "max_posts": 20
  }'
```

---

## 📊 Where to See Results

### Google Sheets

**Main Spreadsheet**: https://docs.google.com/spreadsheets/d/1MPZm4Ya91MJhyAaArXKiw-i18pFjxaVNrvfjbuB9bjg/edit

**Sheets:**
1. **Profiles** - Profile data
2. **Posts JSON Detailed** - Comprehensive JSON post data
3. **Extraction Logs** - Activity tracking

---

## 🔍 What Gets Extracted

### For Each Post:

✅ **Metadata**
- Post URL and ID
- Author name and profile
- Posted date
- Extraction timestamp

✅ **Content Analysis**
- Full text content (up to 2000 chars)
- Summary (200 chars)
- Content type (text/video/image/article/poll)
- Word and character counts

✅ **Engagement Metrics**
- Likes, comments, shares, views
- Calculated engagement rate

✅ **Media Information**
- Media presence detection
- Media type and URLs
- Image and video counts

✅ **Topics & Keywords**
- Hashtags and mentions
- External links
- Detected topics
- Extracted keywords

✅ **Classification**
- Post type (announcement/question/promotional/etc.)
- Sentiment analysis (positive/negative/neutral)
- Category (thought_leadership/company_news/etc.)
- Promotional and question flags

---

## 🐛 Troubleshooting

### Issue: "Unauthorized" Error
**Solution**: Check that your `WEBHOOK_SECRET` matches in Railway variables

### Issue: "Profile URL is required"
**Solution**: Ensure the `url` parameter is included in the request body

### Issue: No posts extracted
**Possible reasons:**
- Profile has no public posts
- Profile privacy settings restrict access
- LinkedIn rate limiting

### Issue: Railway deployment not updating
**Solution**: 
1. Go to Railway dashboard
2. Check Deployments tab
3. Manually trigger redeploy if needed

---

## 📈 Expected Results for Test Profile

**Profile**: https://www.linkedin.com/in/rvss-prasad-39a2a413

**Expected extraction:**
- Profile data written to "Profiles" sheet (row 3)
- All public posts written to "Posts JSON Detailed" sheet
- Extraction logged in "Extraction Logs" sheet
- Each post includes complete JSON structure

---

## 🎯 Success Criteria

✅ Health endpoint returns version 1.1.0  
✅ Profile extraction completes successfully  
✅ Posts extraction returns JSON data  
✅ Data appears in Google Sheets  
✅ Extraction logs show success status  

---

## 📝 Notes

- **Rate Limiting**: Exa AI has rate limits. Space out requests if testing multiple profiles.
- **Public Data Only**: Only publicly visible LinkedIn data can be extracted.
- **Privacy**: Respect LinkedIn's terms of service and user privacy.
- **Data Accuracy**: Extraction accuracy depends on LinkedIn's public data structure.

---

## 🆘 Need Help?

1. **Check Railway Logs**: Go to Railway dashboard → Your service → Logs
2. **Check Extraction Logs Sheet**: See detailed error messages
3. **Verify Environment Variables**: Ensure all required variables are set
4. **Test Health Endpoint**: Confirm service is running

---

## 🚀 Next Steps After Testing

1. ✅ Verify all data in Google Sheets
2. ✅ Review JSON structure and completeness
3. ✅ Test with multiple profiles
4. ✅ Set up automation (Zapier/Make.com)
5. ✅ Enable periodic updates (ENABLE_CRON=true)

---

**Version**: 1.1.0  
**Last Updated**: 2026-01-12  
**Status**: ✅ Deployed and Ready for Testing
