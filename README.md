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
- Rename `env.example` to `.env`
- Open `.env` in any text editor and fill in your credentials:

```
TWITTER_BEARER_TOKEN=your_token_here
TWITTER_USER_ID=your_numeric_id_here
LINKEDIN_ACCESS_TOKEN=your_access_token_here
LINKEDIN_PERSON_URN=urn:li:person:your_person_id_here
```

**Finding your Twitter User ID:** Go to https://tweeterid.com and enter your username.

**LinkedIn setup:** See LinkedIn setup below.

### 4. Run the app
```
npm start
```

Then open your browser and go to: **http://localhost:3000**

---

## LinkedIn Setup (3-legged OAuth — recommended)

LinkedIn restricts the client credentials flow by default. Most apps must use 3-legged OAuth instead. You authorize once, get an access token, and add it to `.env`. The token expires in ~60 days; re-run the flow when it expires.

### Step 1: Add redirect URL
1. Go to https://linkedin.com/developers → your app → **Auth** tab
2. Add `http://localhost:3000` as an authorized redirect URL

### Step 2: Authorize and get a code
Open this URL in your browser (replace `YOUR_CLIENT_ID` with your app's Client ID from the Auth tab):

```
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000&scope=r_liteprofile%20r_emailaddress%20w_member_social%20r_member_postAnalytics
```

3. Authorize the app — LinkedIn redirects to `http://localhost:3000?code=...`
4. Copy the `code` from the URL (the part after `code=`)

### Step 3: Exchange code for access token
Run this in Terminal (replace `YOUR_CODE`, `YOUR_CLIENT_ID`, `YOUR_CLIENT_SECRET`):

```bash
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -d "grant_type=authorization_code" \
  -d "code=YOUR_CODE" \
  -d "redirect_uri=http://localhost:3000" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "client_secret=YOUR_CLIENT_SECRET"
```

5. Copy the `access_token` from the response → add to `.env` as `LINKEDIN_ACCESS_TOKEN`

**Note:** The `r_member_postAnalytics` scope is required for the chart's daily impressions. Re-authorize if you added it after your first token.

### Step 4: Get your Person URN
Your Person URN is `urn:li:person:YOUR_ID`. To find your ID:
- Call `GET https://api.linkedin.com/v2/me` with `Authorization: Bearer YOUR_ACCESS_TOKEN` — the `id` in the response is your ID
- Or use third-party tools that look up LinkedIn member IDs

Add to `.env`: `LINKEDIN_PERSON_URN=urn:li:person:YOUR_ID`

---

**Note:** Client credentials (LINKEDIN_CLIENTID + LINKEDIN_SECRET) require explicit approval from LinkedIn and are rarely granted for personal apps. Use 3-legged OAuth instead.

---

## Deploying to Vercel

1. Push this folder to GitHub (ensure `.env` is in `.gitignore` — it already is)
2. Go to https://vercel.com and import your GitHub repo
3. Add these environment variables in the Vercel project settings:
   - `TWITTER_BEARER_TOKEN`
   - `TWITTER_USER_ID`
   - `LINKEDIN_ACCESS_TOKEN`
   - `LINKEDIN_PERSON_URN`
4. Deploy — Vercel will build and serve the dashboard and API routes

**Local preview with Vercel:**
```
npx vercel dev
```

Never put your `.env` file on GitHub.
