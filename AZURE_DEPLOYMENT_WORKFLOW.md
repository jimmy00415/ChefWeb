# POP Habachi – Full-Stack Azure Deployment Workflow

This guide explains a structured, end-to-end workflow to combine the current frontend (static site in docs/) and backend (Node/Express in Backend/) into a stable, production-ready independent website on Azure.

---

## 1) Target Architecture (Azure)

**Frontend (Static)**
- Azure Static Web Apps (recommended) OR Azure Storage Static Website + Azure CDN
- Serves docs/ for public pages

**Backend (API)**
- Azure App Service (Linux) running Node.js
- Hosts Backend/ API endpoints

**Domain & TLS**
- Azure DNS (or your registrar)
- Managed TLS certs via Static Web Apps/App Service

**Observability**
- Application Insights for backend logs and metrics

---

## 2) Repository Layout (Current)

```
ChefWeb/
├── docs/                  # Frontend (static)
├── Backend/               # Express API
└── AZURE_DEPLOYMENT_WORKFLOW.md
```

---

## 3) Production Workflow Overview

1. **Build & verify locally**
2. **Provision Azure resources**
3. **Deploy backend** (App Service)
4. **Deploy frontend** (Static Web Apps)
5. **Connect frontend to backend** (API base URL)
6. **Custom domain + HTTPS**
7. **Monitoring + logs**

---

## 4) Local Readiness Checklist

**Backend**
- Install dependencies: `npm install` in Backend/
- Confirm server starts: `npm run start`
- Ensure environment variables are ready (.env)

**Frontend**
- Static site located in docs/
- All API calls point to a configurable base URL

---

## 5) Azure Resource Setup

### 5.1 Create a Resource Group
- Example: `chefweb-prod-rg`

### 5.2 Create App Service (Backend)
- Runtime: Node.js LTS
- Plan: Basic or Standard (start small, scale later)

### 5.3 Create Static Web App (Frontend)
- Source: GitHub repo
- Build settings:
  - App location: `docs`
  - Output location: `docs` (or `/` if no build step)

---

## 6) Backend Deployment (App Service)

1. Deploy from GitHub or Azure CLI
2. Configure environment variables in App Service:
   - `PORT`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `OPENAI_API_KEY`
   - `ALLOWED_ORIGINS`
   - any other config from Backend/.env.example
3. Restart App Service

**Health Check**
- Add a health endpoint in API (if not present) and verify it returns 200.

---

## 7) Frontend Deployment (Static Web Apps)

1. Connect GitHub repo to Static Web Apps
2. Set build configuration:
   - `app_location`: `docs`
   - `output_location`: `docs` (if no build pipeline)
3. Update frontend API base URL
   - Use a config file or environment injection in `docs/js` to point to App Service URL

---

## 8) Connect Frontend to Backend

Ensure frontend API calls use the production API base URL:

- Example: `https://<app-service-name>.azurewebsites.net/api/...`

If you want to keep local + production support:
- Use a small config block in JS:
  - If hostname is localhost → use local backend
  - Else → use Azure backend

---

## 9) Custom Domain + HTTPS

**Static Web Apps**
- Add custom domain
- Azure provides TLS automatically

**App Service**
- Add custom domain for API if desired
- Bind TLS cert (App Service managed certificate)

---

## 10) Monitoring & Logging

- Enable Application Insights on App Service
- Review logs for errors, latency, and 4xx/5xx spikes
- Set alerts for downtime or high error rates

---

## 11) CI/CD (Recommended)

**Frontend**
- GitHub Actions auto-deploy on push to main

**Backend**
- App Service continuous deployment from GitHub
- Optionally add a CI pipeline to run tests (if/when tests are added)

---

## 12) Post-Launch Stability Checklist

- ✅ Frontend loads over HTTPS
- ✅ Booking flow works end-to-end
- ✅ Stripe payment test (deposit/full/later)
- ✅ Confirmation page loads correctly
- ✅ API logs show no errors
- ✅ Custom domain works

---

## 13) Recommended Next Enhancements

- Add automated tests (API + UI)
- Add staging environment
- Add rate limiting and WAF if traffic grows
- Add backup/restore strategy for DB (when database is added)

---

## 14) Summary

This workflow combines the static frontend in docs/ with the backend in Backend/ using Azure Static Web Apps + App Service. It keeps deployment simple, provides HTTPS by default, and allows future scaling. After setup, updates are as simple as pushing to main.
