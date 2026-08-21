#!/bin/bash
set -e

echo "🚀 Starting EasyApply 100% Cloudflare Deployment..."

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ─── 1. DEPLOY BACKEND WORKER ───
echo "⚡ Deploying Backend Worker..."
cd "$ROOT_DIR/backend"
npx wrangler deploy

# ─── 2. DEPLOY JOB SEEKER FRONTEND ───
echo "🌐 Building & Deploying Job Seeker Frontend..."
cd "$ROOT_DIR/job-seeker-frontend"
npm run build
npx wrangler pages deploy out --project-name=easyapply-jobseeker --commit-dirty=true

# ─── 3. DEPLOY COMPANY FRONTEND ───
echo "🏢 Building & Deploying Company Frontend..."
cd "$ROOT_DIR/company-frontend"
npm run build
npx wrangler pages deploy out --project-name=easyapply-company --commit-dirty=true

# ─── 4. DEPLOY ADMIN FRONTEND ───
echo "🛡️ Building & Deploying Admin Frontend..."
cd "$ROOT_DIR/admin-frontend"
npm run build
npx wrangler pages deploy out --project-name=easyapply-admin --commit-dirty=true

echo "🎉 All EasyApply components deployed successfully to Cloudflare!"
