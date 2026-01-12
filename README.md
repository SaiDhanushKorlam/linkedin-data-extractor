# LinkedIn Data Extractor

Automated webhook service for extracting LinkedIn profile, company, and post data with Google Sheets integration.

## 🚀 Features

- **Profile Extraction**: Name, headline, company, location, experience, education, skills
- **Company Data**: Industry, size, headquarters, description, specialties
- **Post Analytics**: Content, likes, comments, shares, views, hashtags
- **Auto-sync to Google Sheets**: Structured data storage
- **Periodic Updates**: Optional cron job for automatic profile refreshes
- **Email Enrichment**: Hunter.io integration for finding email addresses

## 📊 Google Sheets Structure

**Spreadsheet URL**: https://docs.google.com/spreadsheets/d/1MPZm4Ya91MJhyAaArXKiw-i18pFjxaVNrvfjbuB9bjg/edit

- **Profiles Sheet**: 20 columns for comprehensive profile data
- **Companies Sheet**: 16 columns for company information
- **Posts Sheet**: 15 columns for post content & engagement
- **Extraction Logs**: Activity tracking and error monitoring
- **Config**: System configuration settings

## 🛠️ Setup

### 1. Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
PORT=3000
SPREADSHEET_ID=1MPZm4Ya91MJhyAaArXKiw-i18pFjxaVNrvfjbuB9bjg
EXA_API_KEY=your_exa_api_key
HUNTER_API_KEY=your_hunter_api_key (optional)
WEBHOOK_SECRET=your_secure_secret_key
GOOGLE_CREDENTIALS={"type":"service_account",...}
ENABLE_CRON=false
```

### 2. Get API Keys

- **Exa AI**: https://exa.ai/ (for LinkedIn data extraction)
- **Hunter.io**: https://hunter.io/ (optional, for email enrichment)
- **Google Service Account**: 
  1. Go to Google Cloud Console
  2. Create a service account
  3. Download JSON credentials
  4. Share your Google Sheet with the service account email

### 3. Deploy to Railway

1. Go to [Railway](https://railway.app/)
2. Create a new project
3. Deploy from GitHub: `SaiDhanushKorlam/linkedin-data-extractor`
4. Add environment variables in Railway dashboard
5. Deploy!

### 4. Local Development

```bash
npm install
npm start
```

## 📡 API Endpoints

### Health Check
```bash
GET /health
```

### Extract Profile
```bash
POST /webhook/profile
Content-Type: application/json

{
  "url": "https://linkedin.com/in/username",
  "secret": "your_webhook_secret"
}
```

### Extract Company
```bash
POST /webhook/company
Content-Type: application/json

{
  "url": "https://linkedin.com/company/company-name",
  "secret": "your_webhook_secret"
}
```

### Extract Posts
```bash
POST /webhook/posts
Content-Type: application/json

{
  "url": "https://linkedin.com/in/username",
  "secret": "your_webhook_secret"
}
```

### Extract All (Profile + Company + Posts)
```bash
POST /webhook/extract-all
Content-Type: application/json

{
  "url": "https://linkedin.com/in/username",
  "secret": "your_webhook_secret",
  "includeProfile": true,
  "includeCompany": true,
  "includePosts": true
}
```

## 🔄 Periodic Updates

Enable automatic profile updates by setting `ENABLE_CRON=true`. The service will:
- Run daily at 2 AM
- Update all profiles in the Profiles sheet
- Respect rate limits (2 seconds between requests)

## 📝 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "url": "https://linkedin.com/in/username",
    "name": "John Doe",
    "headline": "Software Engineer at Tech Corp",
    ...
  }
}
```

### Error Response
```json
{
  "error": "Error message here"
}
```

## 🔒 Security

- All webhook endpoints require a secret key
- Use HTTPS in production
- Keep your API keys secure
- Don't commit `.env` file to git

## 📊 Data Flow

1. Webhook receives LinkedIn URL
2. Exa AI extracts data from LinkedIn
3. Hunter.io enriches with email (optional)
4. Data is written to Google Sheets
5. Extraction logged for monitoring

## 🐛 Troubleshooting

- Check `/health` endpoint for service status
- Review "Extraction Logs" sheet for errors
- Ensure Google Sheet is shared with service account
- Verify all API keys are valid

## 📄 License

MIT

## 👤 Author

Dhanush Korlam
- Email: saidhanushk@panlys.com
- GitHub: [@SaiDhanushKorlam](https://github.com/SaiDhanushKorlam)

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

---

Built with ❤️ using Node.js, Express, Exa AI, and Google Sheets API