#!/bin/bash
set -e

echo "🚀 Starting DearResume / EasyApply 100% Cloudflare Deployment..."

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Load Cloudflare credentials
if [ -f "$ROOT_DIR/backend/.env" ]; then
  export $(grep -E '^CLOUDFLARE_API_TOKEN=' "$ROOT_DIR/backend/.env" | xargs)
fi
export CLOUDFLARE_ACCOUNT_ID="4eed09d0032a07881825f4e926cb997f"

# ─── 1. DEPLOY BACKEND WORKER ───
echo "⚡ Deploying Backend Worker..."
cd "$ROOT_DIR/backend"
npx wrangler deploy

# ─── 2. DEPLOY JOB SEEKER FRONTEND ───
echo "🌐 Building & Deploying Job Seeker Frontend (dearresume.com)..."
cd "$ROOT_DIR/job-seeker-frontend"
npm run build
npx wrangler pages deploy out --project-name=easyapply-jobseeker --branch=main --commit-dirty=true

# ─── 3. DEPLOY COMPANY FRONTEND ───
echo "🏢 Building & Deploying Company Frontend (company.dearresume.com)..."
cd "$ROOT_DIR/company-frontend"
npm run build
npx wrangler pages deploy out --project-name=easyapply-company --branch=main --commit-dirty=true

# ─── 4. DEPLOY ADMIN FRONTEND ───
echo "🛡️ Building & Deploying Admin Frontend (admin.dearresume.com)..."
cd "$ROOT_DIR/admin-frontend"
npm run build
npx wrangler pages deploy out --project-name=easyapply-admin --branch=main --commit-dirty=true

echo "🎉 All DearResume components deployed successfully to Cloudflare Production!"
