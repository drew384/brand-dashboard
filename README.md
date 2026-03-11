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
LINKEDIN_CLIENTID=your_client_id_here
LINKEDIN_SECRET=your_client_secret_here
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

## LinkedIn Setup (Client Credentials)

This app uses LinkedIn's client credentials flow — no manual OAuth or token refresh needed.

1. Go to https://linkedin.com/developers and create an app (or use an existing one)
2. In your app → **Auth** tab, copy the **Client ID** and **Client Secret** into `.env` as `LINKEDIN_CLIENTID` and `LINKEDIN_SECRET`
3. Get your **Person URN** (e.g. `urn:li:person:ABC123`):
   - Option A: Use the LinkedIn API to fetch your profile and read the `id` from the response
   - Option B: Your URN is often your numeric LinkedIn member ID — you can find it via third‑party tools or your profile URL
4. Add `LINKEDIN_PERSON_URN=urn:li:person:YOUR_ID` to `.env`

Note: Some personal profile endpoints may require user-delegated OAuth. If metrics fail, consider using the 3-legged OAuth flow with `LINKEDIN_ACCESS_TOKEN` and `LINKEDIN_PERSON_URN` instead.

---

## Deploying to Vercel

1. Push this folder to GitHub (ensure `.env` is in `.gitignore` — it already is)
2. Go to https://vercel.com and import your GitHub repo
3. Add these environment variables in the Vercel project settings:
   - `TWITTER_BEARER_TOKEN`
   - `TWITTER_USER_ID`
   - `LINKEDIN_CLIENTID`
   - `LINKEDIN_SECRET`
   - `LINKEDIN_PERSON_URN`
4. Deploy — Vercel will build and serve the dashboard and API routes

**Local preview with Vercel:**
```
npx vercel dev
```

Never put your `.env` file on GitHub.
