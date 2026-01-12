// Enhanced Post Extraction with Comprehensive JSON Format
// This module provides detailed post content extraction in structured JSON

/**
 * Extract comprehensive post data with full JSON structure
 * @param {string} profileUrl - LinkedIn profile or company URL
 * @param {string} exaApiKey - Exa AI API key
 * @returns {Promise<Array>} Array of detailed post objects
 */
async function extractPostsDetailed(profileUrl, exaApiKey) {
  const axios = require('axios');
  
  try {
    // Search for posts from the profile
    const response = await axios.post('https://api.exa.ai/search', {
      query: `${profileUrl} posts site:linkedin.com`,
      type: 'keyword',
      numResults: 20,
      contents: {
        text: true,
      },
    }, {
      headers: {
        'x-api-key': exaApiKey,
        'Content-Type': 'application/json',
      },
    });

    const posts = [];
    
    for (const result of response.data.results) {
      // Extract detailed post information
      const postData = {
        metadata: {
          post_url: result.url,
          post_id: extractPostId(result.url),
          author_name: extractAuthorName(result.text),
          author_profile_url: profileUrl,
          posted_date: extractPostDate(result.text),
          extraction_timestamp: new Date().toISOString(),
        },
        content: {
          full_text: extractFullContent(result.text),
          summary: extractSummary(result.text),
          content_type: determineContentType(result.text),
          language: 'en', // Can be enhanced with language detection
          word_count: countWords(extractFullContent(result.text)),
          character_count: extractFullContent(result.text).length,
        },
        engagement: {
          likes: parseInt(extractLikes(result.text)) || 0,
          comments: parseInt(extractComments(result.text)) || 0,
          shares: parseInt(extractShares(result.text)) || 0,
          views: parseInt(extractViews(result.text)) || 0,
          engagement_rate: calculateEngagementRate(result.text),
        },
        media: {
          has_media: checkHasMedia(result.text),
          media_type: extractMediaType(result.text),
          media_urls: extractMediaUrls(result.text),
          image_count: countImages(result.text),
          video_count: countVideos(result.text),
        },
        topics: {
          hashtags: extractHashtags(result.text),
          mentions: extractMentions(result.text),
          links: extractLinks(result.text),
          topics: extractTopics(result.text),
          keywords: extractKeywords(result.text),
        },
        classification: {
          post_type: classifyPostType(result.text),
          sentiment: analyzeSentiment(result.text),
          category: categorizePost(result.text),
          is_promotional: isPromotional(result.text),
          is_question: isQuestion(result.text),
        },
        raw_data: {
          raw_text: result.text,
          source: 'Exa AI',
        }
      };
      
      posts.push(postData);
    }
    
    return posts;
  } catch (error) {
    console.error('Error extracting detailed posts:', error.message);
    throw error;
  }
}

// Helper functions for detailed extraction

function extractPostId(url) {
  const match = url.match(/activity-(\d+)/);
  return match ? match[1] : '';
}

function extractFullContent(text) {
  // Extract the main post content, removing navigation and UI elements
  const lines = text.split('\n');
  const contentLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.length > 20 && 
           !trimmed.startsWith('Like') && 
           !trimmed.startsWith('Comment') &&
           !trimmed.startsWith('Share') &&
           !trimmed.includes('followers') &&
           !trimmed.includes('connections');
  });
  return contentLines.join(' ').substring(0, 2000);
}

function extractSummary(text) {
  const content = extractFullContent(text);
  return content.substring(0, 200) + (content.length > 200 ? '...' : '');
}

function determineContentType(text) {
  if (text.includes('video') || text.includes('watch')) return 'video';
  if (text.includes('image') || text.includes('photo')) return 'image';
  if (text.includes('article') || text.includes('read more')) return 'article';
  if (text.includes('poll')) return 'poll';
  return 'text';
}

function countWords(text) {
  return text.split(/\s+/).filter(word => word.length > 0).length;
}

function extractLikes(text) {
  const patterns = [
    /(\d+(?:,\d+)*)\s*(?:likes?|reactions?)/i,
    /(\d+(?:,\d+)*)\s*people reacted/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].replace(/,/g, '');
  }
  return '0';
}

function extractComments(text) {
  const match = text.match(/(\d+(?:,\d+)*)\s*comments?/i);
  return match ? match[1].replace(/,/g, '') : '0';
}

function extractShares(text) {
  const match = text.match(/(\d+(?:,\d+)*)\s*(?:shares?|reposts?)/i);
  return match ? match[1].replace(/,/g, '') : '0';
}

function extractViews(text) {
  const match = text.match(/(\d+(?:,\d+)*)\s*views?/i);
  return match ? match[1].replace(/,/g, '') : '0';
}

function calculateEngagementRate(text) {
  const likes = parseInt(extractLikes(text)) || 0;
  const comments = parseInt(extractComments(text)) || 0;
  const shares = parseInt(extractShares(text)) || 0;
  const views = parseInt(extractViews(text)) || 1;
  
  const totalEngagement = likes + comments + shares;
  return ((totalEngagement / views) * 100).toFixed(2) + '%';
}

function checkHasMedia(text) {
  return text.includes('image') || text.includes('video') || text.includes('photo');
}

function extractMediaType(text) {
  if (text.includes('video')) return 'video';
  if (text.includes('image') || text.includes('photo')) return 'image';
  if (text.includes('document') || text.includes('pdf')) return 'document';
  return 'none';
}

function extractMediaUrls(text) {
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  return urls.filter(url => 
    url.includes('image') || 
    url.includes('video') || 
    url.includes('media') ||
    url.includes('.jpg') ||
    url.includes('.png') ||
    url.includes('.mp4')
  );
}

function countImages(text) {
  const imageMatches = text.match(/image|photo|picture/gi);
  return imageMatches ? imageMatches.length : 0;
}

function countVideos(text) {
  const videoMatches = text.match(/video|watch/gi);
  return videoMatches ? videoMatches.length : 0;
}

function extractHashtags(text) {
  const hashtags = text.match(/#[\w]+/g) || [];
  return hashtags;
}

function extractMentions(text) {
  const mentions = text.match(/@[\w]+/g) || [];
  return mentions;
}

function extractLinks(text) {
  const links = text.match(/https?:\/\/[^\s]+/g) || [];
  return links.filter(link => !link.includes('linkedin.com/in/'));
}

function extractTopics(text) {
  // Simple topic extraction based on common keywords
  const topics = [];
  const topicKeywords = {
    'technology': ['AI', 'tech', 'software', 'digital', 'innovation'],
    'business': ['business', 'strategy', 'growth', 'revenue', 'market'],
    'leadership': ['leadership', 'management', 'team', 'culture'],
    'career': ['career', 'job', 'hiring', 'opportunity'],
    'education': ['learning', 'education', 'training', 'course'],
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase()))) {
      topics.push(topic);
    }
  }
  
  return topics;
}

function extractKeywords(text) {
  // Extract important words (simple implementation)
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  const keywords = words
    .filter(word => word.length > 4 && !stopWords.includes(word))
    .slice(0, 10);
  return [...new Set(keywords)]; // Remove duplicates
}

function classifyPostType(text) {
  if (text.includes('hiring') || text.includes('job opening')) return 'job_posting';
  if (text.includes('article') || text.includes('blog')) return 'article_share';
  if (text.includes('congratulations') || text.includes('proud to announce')) return 'announcement';
  if (text.includes('?') && text.split('?').length > 2) return 'question';
  if (text.includes('check out') || text.includes('learn more')) return 'promotional';
  return 'general_update';
}

function analyzeSentiment(text) {
  // Simple sentiment analysis
  const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'excited'];
  const negativeWords = ['bad', 'terrible', 'awful', 'disappointed', 'unfortunately', 'sad'];
  
  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function categorizePost(text) {
  const categories = {
    'thought_leadership': ['insights', 'perspective', 'believe', 'think'],
    'company_news': ['announce', 'launch', 'release', 'introducing'],
    'personal_story': ['my journey', 'my experience', 'I learned'],
    'industry_news': ['industry', 'market', 'trend', 'report'],
    'engagement': ['what do you think', 'share your', 'let me know'],
  };
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => text.toLowerCase().includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

function isPromotional(text) {
  const promotionalKeywords = ['buy', 'purchase', 'discount', 'offer', 'sale', 'limited time', 'sign up'];
  return promotionalKeywords.some(keyword => text.toLowerCase().includes(keyword));
}

function isQuestion(text) {
  return text.includes('?') || text.toLowerCase().includes('what do you think');
}

function extractAuthorName(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines[0] || 'Unknown';
}

function extractPostDate(text) {
  const patterns = [
    /(\d{1,2}\s+(?:hours?|days?|weeks?|months?)\s+ago)/i,
    /(\d{1,2}[hd])/i,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return 'Recent';
}

module.exports = {
  extractPostsDetailed,
};
