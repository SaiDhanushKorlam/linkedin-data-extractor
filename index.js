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
      profilePicture: '',
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

// Helper: Extract company data
async function extractCompany(companyUrl) {
  const startTime = Date.now();
  try {
    const response = await axios.post('https://api.exa.ai/search', {
      query: companyUrl,
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
    
    const companyData = {
      url: companyUrl,
      name: extractCompanyName(data.text),
      industry: extractIndustry(data.text),
      size: extractCompanySize(data.text),
      headquarters: extractHeadquarters(data.text),
      website: extractWebsite(data.text),
      description: extractDescription(data.text),
      specialties: extractSpecialties(data.text),
      founded: extractFounded(data.text),
      employeeCount: '',
      followerCount: '',
      logo: '',
      extractionDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'Success',
      error: '',
    };

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Companies!A:P',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [Object.values(companyData)],
      },
    });

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logExtraction('Company', companyUrl, 'Success', 1, duration);

    return { success: true, data: companyData };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logExtraction('Company', companyUrl, 'Failed', 0, duration, error.message);
    throw error;
  }
}

// Helper: Extract posts
async function extractPosts(profileUrl) {
  const startTime = Date.now();
  try {
    const response = await axios.post('https://api.exa.ai/search', {
      query: `${profileUrl} posts`,
      type: 'keyword',
      numResults: 10,
      contents: {
        text: true,
      },
    }, {
      headers: {
        'x-api-key': EXA_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const posts = response.data.results.map(post => ({
      url: post.url,
      authorName: extractAuthorName(post.text),
      authorProfile: profileUrl,
      postType: 'Post',
      content: extractPostContent(post.text),
      postedDate: extractPostDate(post.text),
      likes: extractLikes(post.text),
      comments: extractComments(post.text),
      shares: extractShares(post.text),
      views: extractViews(post.text),
      mediaUrls: '',
      hashtags: extractHashtags(post.text),
      extractionDate: new Date().toISOString(),
      status: 'Success',
      error: '',
    }));

    // Batch write to Posts sheet
    if (posts.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Posts!A:O',
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: posts.map(p => Object.values(p)),
        },
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logExtraction('Posts', profileUrl, 'Success', posts.length, duration);

    return { success: true, data: posts };
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    await logExtraction('Posts', profileUrl, 'Failed', 0, duration, error.message);
    throw error;
  }
}

// Text extraction helpers (basic implementations - enhance as needed)
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

function extractCompanyName(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines[0] || 'Unknown';
}

function extractIndustry(text) {
  const match = text.match(/Industry[:\s]+([^\n]+)/i);
  return match ? match[1].trim() : '';
}

function extractCompanySize(text) {
  const match = text.match(/(\d+[-–]\d+|\d+\+)\s+employees/i);
  return match ? match[1] : '';
}

function extractHeadquarters(text) {
  const match = text.match(/Headquarters[:\s]+([^\n]+)/i);
  return match ? match[1].trim() : '';
}

function extractWebsite(text) {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : '';
}

function extractDescription(text) {
  return text.substring(0, 500);
}

function extractSpecialties(text) {
  const match = text.match(/Specialties[:\s]+([^\n]+)/i);
  return match ? match[1].trim() : '';
}

function extractFounded(text) {
  const match = text.match(/Founded[:\s]+(\d{4})/i);
  return match ? match[1] : '';
}

function extractAuthorName(text) {
  const lines = text.split('\n').filter(l => l.trim());
  return lines[0] || 'Unknown';
}

function extractPostContent(text) {
  return text.substring(0, 1000);
}

function extractPostDate(text) {
  const match = text.match(/(\d{1,2}\s+(?:hours?|days?|weeks?|months?)\s+ago)/i);
  return match ? match[1] : '';
}

function extractLikes(text) {
  const match = text.match(/(\d+(?:,\d+)*)\s*(?:likes?|reactions?)/i);
  return match ? match[1].replace(/,/g, '') : '0';
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

app.post('/webhook/company', async (req, res) => {
  try {
    const { url, secret } = req.body;
    
    if (secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!url) {
      return res.status(400).json({ error: 'Company URL is required' });
    }

    const result = await extractCompany(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/webhook/posts', async (req, res) => {
  try {
    const { url, secret } = req.body;
    
    if (secret !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!url) {
      return res.status(400).json({ error: 'Profile/Company URL is required' });
    }

    const result = await extractPosts(url);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/webhook/extract-all', async (req, res) => {
  try {
    const { url, secret, includeProfile, includeCompany, includePosts } = req.body;
    
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

    if (includeCompany !== false && results.profile?.data?.company) {
      const companyName = results.profile.data.company.toLowerCase().replace(/\s+/g, '-');
      results.company = await extractCompany(`https://linkedin.com/company/${companyName}`);
    }

    if (includePosts !== false) {
      results.posts = await extractPosts(url);
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
    hasGoogleCreds: !!process.env.GOOGLE_CREDENTIALS
  });
});

app.get('/', (req, res) => {
  res.json({
    service: 'LinkedIn Data Extractor',
    version: '1.0.0',
    endpoints: {
      profile: 'POST /webhook/profile',
      company: 'POST /webhook/company',
      posts: 'POST /webhook/posts',
      extractAll: 'POST /webhook/extract-all',
      health: 'GET /health'
    },
    documentation: 'https://github.com/SaiDhanushKorlam/linkedin-data-extractor'
  });
});

// Periodic update cron job (runs daily at 2 AM)
if (process.env.ENABLE_CRON === 'true') {
  cron.schedule('0 2 * * *', async () => {
    console.log('Running periodic profile updates...');
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Profiles!A2:A',
      });

      const profileUrls = response.data.values?.map(row => row[0]) || [];
      
      for (const url of profileUrls) {
        try {
          await extractProfile(url);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
        } catch (error) {
          console.error(`Failed to update ${url}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Periodic update failed:', error.message);
    }
  });
}

app.listen(PORT, () => {
  console.log(`LinkedIn Data Extractor webhook service running on port ${PORT}`);
  console.log(`Spreadsheet ID: ${SPREADSHEET_ID}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});