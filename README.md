# Brand Dashboard

A Node.js web app that securely pulls your Twitter/X and LinkedIn metrics and displays them in a clean dashboard.

---

## Setup (5 minutes)

### 1. Install Node.js
Download from https://nodejs.org — grab the LTS version and install it.

### 2. Install dependencies
Open Terminal (Mac) or Command Prompt (Windows), navigate to this folder, and run:
```
npm install
```

### 3. Add your API credentials
- Rename `.env.example` to `.env`
- Open `.env` in any text editor and fill in your credentials:

```
TWITTER_BEARER_TOKEN=your_token_here
TWITTER_USER_ID=your_numeric_id_here
LINKEDIN_ACCESS_TOKEN=your_token_here
LINKEDIN_PERSON_URN=urn:li:person:your_id_here
```

**Finding your Twitter User ID:** Go to https://tweeterid.com and enter your username.

**LinkedIn Access Token:** See LinkedIn OAuth setup below.

### 4. Run the app
```
npm start
```

Then open your browser and go to: **http://localhost:3000**

---

## LinkedIn OAuth Setup

LinkedIn requires a one-time OAuth flow to get your access token:

1. Go to https://linkedin.com/developers → your app → Auth tab
2. Add `http://localhost:3000` as a redirect URL
3. Open this URL in your browser (replace YOUR_CLIENT_ID):
```
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000&scope=r_liteprofile%20r_emailaddress%20w_member_social
```
4. Authorize the app — LinkedIn redirects you back with a `?code=` in the URL
5. Copy that code and run this in Terminal (replace the placeholders):
```
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_CODE" \
  -d "redirect_uri=http://localhost:3000" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```
6. Copy the `access_token` from the response → paste into your `.env`

Note: LinkedIn tokens expire every 60 days.

---

## Deploying online (optional)

To access this from anywhere (not just your laptop):

1. Push this folder to GitHub (make sure `.env` is in `.gitignore` — it already is)
2. Deploy to Railway.app (free tier):
   - Connect your GitHub repo
   - Add your environment variables in Railway's dashboard
   - It gives you a public URL

Never put your `.env` file on GitHub.
