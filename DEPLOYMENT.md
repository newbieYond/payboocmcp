# Deployment Guide

Complete guide for deploying PaybooCMCP to Vercel with GitHub integration.

## Prerequisites

- Node.js 18+ installed
- Git installed
- GitHub account
- Vercel account (free tier works)

## Step 1: GitHub Repository Setup

### Create GitHub Repository

1. Visit [github.com/new](https://github.com/new)
2. Repository name: `payboocmcp`
3. Description: `TypeScript MCP server for CSV URL processing`
4. Choose: Public or Private
5. **DO NOT** initialize with README (we already have one)
6. Click "Create repository"

### Push Local Code to GitHub

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/payboocmcp.git

# Push to GitHub
git push -u origin main
```

Expected output:
```
Enumerating objects: 16, done.
Counting objects: 100% (16/16), done.
Delta compression using up to 8 threads
Compressing objects: 100% (13/13), done.
Writing objects: 100% (16/16), 123.45 KiB | 12.34 MiB/s, done.
Total 16 (delta 0), reused 0 (delta 0), pack-reused 0
To https://github.com/YOUR_USERNAME/payboocmcp.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

## Step 2: Vercel Deployment

### Option A: Vercel CLI (Recommended for Testing)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy to Preview**:
   ```bash
   vercel
   ```

   Answer the prompts:
   - Set up and deploy? → Yes
   - Which scope? → Your account
   - Link to existing project? → No
   - Project name? → payboocmcp (default)
   - Directory? → ./ (current directory)
   - Override settings? → No

4. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

### Option B: Vercel Dashboard (Recommended for Auto-Deploy)

1. **Visit Vercel Dashboard**:
   - Go to [vercel.com/new](https://vercel.com/new)

2. **Import Git Repository**:
   - Click "Import Git Repository"
   - Select GitHub
   - Authorize Vercel to access your repositories
   - Search for `payboocmcp`
   - Click "Import"

3. **Configure Project**:
   - **Project Name**: `payboocmcp`
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: `npm run build` (auto-detected)
   - **Output Directory**: `dist` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

4. **Environment Variables** (Optional):
   - Key: `CSV_DATA_DIR`
   - Value: `data`

5. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

## Step 3: Verify Deployment

### Check Deployment Status

Vercel will provide:
- **Production URL**: `https://payboocmcp.vercel.app`
- **Deployment Log**: View build output
- **Preview URL**: For each PR/commit

### Test Deployment

Visit your deployment URL:
```
https://payboocmcp-your-username.vercel.app
```

## Step 4: Automatic Deployments

Once connected to GitHub, Vercel automatically:

1. **Production Deployments**:
   - Triggered on push to `main` branch
   - URL: `https://payboocmcp.vercel.app`

2. **Preview Deployments**:
   - Triggered on push to any other branch
   - Triggered on pull requests
   - Unique URL for each deployment

### Workflow

```bash
# Make changes locally
git checkout -b feature/new-csv-parser

# Commit changes
git add .
git commit -m "Update CSV parser logic"

# Push to GitHub
git push origin feature/new-csv-parser

# Vercel creates preview deployment automatically
# URL: https://payboocmcp-git-feature-new-csv-parser-username.vercel.app
```

## Step 5: Local MCP Usage

The server is primarily designed for local MCP usage, not HTTP endpoints.

### Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "payboocmcp": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/Projects/payboocmcp/dist/index.js"
      ],
      "env": {
        "CSV_DATA_DIR": "/Users/YOUR_USERNAME/Projects/payboocmcp/data"
      }
    }
  }
}
```

Replace `/Users/YOUR_USERNAME/Projects/payboocmcp` with your actual path.

### Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP server.

## Monitoring & Management

### Vercel Dashboard

Access at [vercel.com/dashboard](https://vercel.com/dashboard):

- **Deployments**: View all deployments
- **Analytics**: Traffic and performance metrics
- **Logs**: Runtime logs and errors
- **Settings**: Environment variables, domains

### Update Deployment

```bash
# Method 1: Push to GitHub (auto-deploys)
git add .
git commit -m "Update CSV processing logic"
git push origin main

# Method 2: Vercel CLI
vercel --prod
```

## Troubleshooting

### Build Fails

Check build logs in Vercel dashboard:
- Common issue: Missing dependencies
- Solution: Ensure `package.json` is up to date

### CSV Files Not Found

Ensure CSV files are in `data/` directory and committed to Git:
```bash
git add data/*.csv
git commit -m "Add CSV data files"
git push origin main
```

### MCP Server Not Working Locally

1. Rebuild the project:
   ```bash
   npm run build
   ```

2. Check paths in Claude Desktop config

3. Verify CSV_DATA_DIR points to correct directory

## Advanced Configuration

### Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed

### Environment Variables

Add via Vercel Dashboard or CLI:

```bash
vercel env add CSV_DATA_DIR
```

### Deployment Hooks

Trigger deployments programmatically:
1. Vercel Dashboard → Settings → Git → Deploy Hooks
2. Create hook
3. POST to webhook URL to trigger deployment

## Security Best Practice

1. **Never commit sensitive data** in CSV files
2. Use **environment variables** for secrets
3. Add sensitive files to `.gitignore`
4. Review **public access** settings on GitHub/Vercel

## Next Steps

1. ✅ Test MCP server locally with Claude Desktop
2. ✅ Add more CSV files to `data/` directory
3. ✅ Customize URL extraction logic in [csv-processor.ts](src/csv-processor.ts)
4. ✅ Monitor deployments in Vercel Dashboard
5. ✅ Set up custom domain (optional)

## Support

- **Vercel Docs**: https://vercel.com/docs
- **MCP Spec**: https://spec.modelcontextprotocol.io/
- **GitHub Issues**: Create issue in your repository
