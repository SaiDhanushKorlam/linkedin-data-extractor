const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const cron = require('node-cron');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1MPZm4Ya91MJhyAaArXKiw-i18pFjxaVNrvfjbuB9bjg';
const EXA_API_KEY = process.env.EXA_API_KEY;
const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key';

// Google Sheets setup
let sheets;
try {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheets = google.sheets({ version: 'v4', auth });
} catch (error) {
  console.error('Google Sheets auth error:', error.message);
}

// Helper: Log to Extraction Logs sheet
async function logExtraction(type, url, status, records, duration, error = '') {
  try {
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Extraction Logs!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[timestamp, type, url, status, records, duration, error, 'Webhook']],
      },
    });
  } catch (err) {
    console.error('Failed to log extraction:', err.message);
  }
}

// Helper: Extract LinkedIn profile data using Exa
async function extractProfile(profileUrl) {
  const startTime = Date.now();
  try {
    const response = await axios.post('https://api.exa.ai/search', {
      query: profileUrl,
      type: 'keyword',
      numResults: 1,
      contents: {
        text: true,
      },
    }, {
      headers: {
        'x-api-key': EXA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = response.data.results[0];
    
    // Extract profile information
    const profileData = {
      url: profileUrl,
      name: extractName(data.text),
      headline: extractHeadline(data.text),
      company: extractCompany(data.text),
      title: extractTitle(data.text),
      location: extractLocation(data.text),
      summary: extractSummary(data.text),
      experience: JSON.stringify(extractExperience(data.text)),
      education: JSON.stringify(extractEducation(data.text)),
      skills: extractSkills(data.text),
      connections: '',
      profilePicture: data.image || '',
      email: '',
      phone: '',
      website: '',
      extractionDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'Success',
      error: '',
      source: 'Exa AI',
    };

    // Try to enrich with Hunter.io
    if (HUNTER_API_KEY && profileData.name && profileData.company) {
      try {
        const hunterResponse = await axios.get('https://api.hunter.io/v2/email-finder', {
          params: {
            domain: `${profileData.company.toLowerCase().replace(/\s+/g, '')}.com`,
            first_name: profileData.name.split(' ')[0],
            last_name: profileData.name.split(' ').slice(-1)[0],
            api_key: HUNTER_API_KEY,
          },
        });
        if (hunterResponse.data.data && hunterResponse.data.data.email) {
          profileData.email = hunterResponse.data.data.email;
        }
      } catch (e) {
        console.log('Hunter enrichment failed:', e.message);
      }
    }

    // Write to Profiles sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Profiles!A:T',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [Object.values(profileData)],
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logExtraction('Profile', profileUrl, 'Success', 1, duration);

    return { success: true, data: profileData };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logExtraction('Profile', profileUrl, 'Failed', 0, duration, error.message);
    throw error;
  }
}

// Helper: Extract posts with detailed JSON
async function extractPostsDetailed(profileUrl, maxPosts = 20) {
  const startTime = Date.now();
  try {
    const response = await axios.post('https://api.exa.ai/search', {
      query: `${profileUrl} posts site:linkedin.com`,
      type: 'keyword',
      numResults: maxPosts,
      contents: {
        text: true,
      },
    }, {
      headers: {
        'x-api-key': EXA_API_KEY,
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
          summary: extractContentSummary(result.text),
          content_type: determineContentType(result.text),
          language: 'en',
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
          media_urls: extractMediaUrls(result.text, result.image),
          image_count: countImages(result.text),
          video_count: countVideos(result.text),
        },
        topics: {
          hashtags: extractHashtagsArray(result.text),
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
          raw_text: result.text.substring(0, 1000),
          source: 'Exa AI',
        }
      };
      
      posts.push(postData);

      // Write to Posts JSON Detailed sheet
      const fullJson = JSON.stringify(postData);
      const metadataJson = JSON.stringify(postData.metadata);
      const contentJson = JSON.stringify(postData.content);
      const engagementJson = JSON.stringify(postData.engagement);
      const mediaJson = JSON.stringify(postData.media);
      const topicsJson = JSON.stringify(postData.topics);
      const classificationJson = JSON.stringify(postData.classification);

      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Posts JSON Detailed!A:J',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: [[
            postData.metadata.post_url,
            postData.metadata.author_name,
            fullJson,
            metadataJson,
            contentJson,
            engagementJson,
            mediaJson,
            topicsJson,
            classificationJson,
            postData.metadata.extraction_timestamp
          ]],
        },
      });
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logExtraction('Posts JSON Detailed', profileUrl, 'Success', posts.length, duration);

    return { success: true, data: { profile_url: profileUrl, total_posts: posts.length, posts } };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logExtraction('Posts JSON Detailed', profileUrl, 'Failed', 0, duration, error.message);
    throw error;
  }
}

// Enhanced extraction helper functions
function extractPostId(url) {
  const match = url.match(/activity-(\d+)/);
  return match ? match[1] : '';
}

function extractFullContent(text) {
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

function extractContentSummary(text) {
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

function calculateEngagementRate(text) {
  const likes = parseInt(extractLikes(text)) || 0;
  const comments = parseInt(extractComments(text)) || 0;
  const shares = parseInt(extractShares(text)) || 0;
  const views = parseInt(extractViews(text)) || 1;
  
  const totalEngagement = likes + comments + shares;
  return views > 0 ? ((totalEngagement / views) * 100).toFixed(2) + '%' : 'N/A';
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

function extractMediaUrls(text, imageUrl) {
  const urls = text.match(/https?:\/\/[^\s]+/g) || [];
  const mediaUrls = urls.filter(url => 
    url.includes('image') || 
    url.includes('video') || 
    url.includes('media') ||
    url.includes('.jpg') ||
    url.includes('.png') ||
    url.includes('.mp4')
  );
  if (imageUrl) mediaUrls.push(imageUrl);
  return mediaUrls;
}

function countImages(text) {
  const imageMatches = text.match(/image|photo|picture/gi);
  return imageMatches ? imageMatches.length : 0;
}

function countVideos(text) {
  const videoMatches = text.match(/video|watch/gi);
  return videoMatches ? videoMatches.length : 0;
}

function extractHashtagsArray(text) {
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
  const words = text.toLowerCase().split(/\s+/);
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
  const keywords = words
    .filter(word => word.length > 4 && !stopWords.includes(word))
    .slice(0, 10);
  return [...new Set(keywords)];
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

// Basic extraction helpers
function extractName(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines[0] || 'Unknown';
}

function extractHeadline(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines[1] || '';
}

function extractCompany(text) {
  const match = text.match(/at\s+([^\n|]+)/i);
  return match ? match[1].trim() : '';
}

function extractTitle(text) {
  const match = text.match(/^([^\n]+)\s+at\s+/im);
  return match ? match[1].trim() : '';
}

function extractLocation(text) {
  const match = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2,})/);
  return match ? match[0] : '';
}

function extractSummary(text) {
  return text.substring(0, 500);
}

function extractExperience(text) {
  return [];
}

function extractEducation(text) {
  return [];
}

function extractSkills(text) {
  return '';
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

function extractHashtags(text) {
  const hashtags = text.match(/#\w+/g);
  return hashtags ? hashtags.join(', ') : '';
}

// Webhook endpoints
app.post('/webhook/profile', async (req, res) => {
  try {
    const { url, secret } = req.body;
    
    if (secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!url) {
      return res.status(400).json({ error: 'Profile URL is required' });
    }

    const result = await extractProfile(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/webhook/posts-detailed', async (req, res) => {
  try {
    const { url, secret, max_posts } = req.body;
    
    if (secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!url) {
      return res.status(400).json({ error: 'Profile URL is required' });
    }

    const maxPosts = max_posts || 20;
    const result = await extractPostsDetailed(url, maxPosts);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/webhook/extract-all', async (req, res) => {
  try {
    const { url, secret, includeProfile, includePosts, max_posts } = req.body;
    
    if (secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const results = {};

    if (includeProfile !== false) {
      results.profile = await extractProfile(url);
    }

    if (includePosts !== false) {
      const maxPosts = max_posts || 20;
      results.posts = await extractPostsDetailed(url, maxPosts);
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    spreadsheetId: SPREADSHEET_ID,
    hasExaKey: !!EXA_API_KEY,
    hasHunterKey: !!HUNTER_API_KEY,
    hasGoogleCreds: !!process.env.GOOGLE_CREDENTIALS,
    version: '1.1.0',
    features: ['profile_extraction', 'posts_json_detailed', 'extract_all']
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'LinkedIn Data Extractor',
    version: '1.1.0',
    endpoints: {
      profile: 'POST /webhook/profile',
      postsDetailed: 'POST /webhook/posts-detailed',
      extractAll: 'POST /webhook/extract-all',
      health: 'GET /health'
    },
    documentation: 'https://github.com/SaiDhanushKorlam/linkedin-data-extractor'
  });
});

app.listen(PORT, () => {
  console.log(`LinkedIn Data Extractor v1.1.0 running on port ${PORT}`);
  console.log(`Spreadsheet ID: ${SPREADSHEET_ID}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Features: Profile extraction, Posts JSON detailed, Extract all`);
});
