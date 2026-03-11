# Brand Dashboard — Backend API

A simple Vercel serverless proxy that securely connects your personal brand dashboard to Twitter/X and LinkedIn.

---

## Deploy to Vercel (15 min setup)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Clone & deploy
```bash
cd brand-dashboard
vercel
```
Follow the prompts. Vercel will give you a deployment URL like `https://brand-dashboard-xxx.vercel.app`.

---

## Environment Variables

In your Vercel dashboard → Project Settings → Environment Variables, add:

### Twitter/X
| Variable | Value |
|---|---|
| `TWITTER_BEARER_TOKEN` | Your Bearer Token from developer.x.com |
| `TWITTER_USER_ID` | Your numeric Twitter user ID |

**To find your Twitter User ID:**
Go to `https://api.twitter.com/2/users/by/username/YOUR_USERNAME` in your browser with your Bearer Token, or use [tweeterid.com](https://tweeterid.com).

### LinkedIn
| Variable | Value |
|---|---|
| `LINKEDIN_ACCESS_TOKEN` | OAuth 2.0 access token (see below) |
| `LINKEDIN_PERSON_URN` | Your LinkedIn URN e.g. `urn:li:person:abc123` |

**To get your LinkedIn Access Token:**

LinkedIn requires a full OAuth 2.0 flow. Steps:
1. Go to [linkedin.com/developers](https://linkedin.com/developers) → your app
2. Under Auth, add `https://brand-dashboard-xxx.vercel.app/api/linkedin-callback` as a redirect URL
3. Use this URL to authorize (replace CLIENT_ID):
   ```
   https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=CLIENT_ID&redirect_uri=YOUR_REDIRECT&scope=r_liteprofile%20r_emailaddress%20w_member_social%20r_organization_social
   ```
4. After authorizing, LinkedIn redirects you with a `code` param
5. Exchange the code for a token:
   ```bash
   curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
     -d grant_type=authorization_code \
     -d code=YOUR_CODE \
     -d redirect_uri=YOUR_REDIRECT \
     -d client_id=YOUR_CLIENT_ID \
     -d client_secret=YOUR_CLIENT_SECRET
   ```
6. Copy the `access_token` from the response → paste into Vercel env vars

**Note:** LinkedIn access tokens expire every 60 days. You'll need to refresh using the `refresh_token` returned in step 6.

---

## API Endpoints

Once deployed:

- `GET /api/twitter` → returns `{ followers, impressions_7d }`
- `GET /api/linkedin` → returns `{ followers, impressions_30d }`

---

## Connect to your Dashboard

In `brand-dashboard.jsx`, replace the mock data fetch with:

```js
const API_BASE = "https://your-vercel-url.vercel.app";

const [twitterData, setTwitterData] = useState(null);
const [linkedinData, setLinkedinData] = useState(null);

useEffect(() => {
  fetch(`${API_BASE}/api/twitter`).then(r => r.json()).then(setTwitterData);
  fetch(`${API_BASE}/api/linkedin`).then(r => r.json()).then(setLinkedinData);
}, []);
```

---

## Local Development

```bash
vercel dev
```

Create a `.env.local` file with your env vars for local testing. Never commit this file.
