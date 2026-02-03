# Custom Domain Setup Guide for POP Habachi

## Step 1: Purchase a Domain

Recommended registrars:
- **Namecheap** (https://namecheap.com) - Best value
- **Google Domains** (https://domains.google) - Easy Cloud Run integration
- **Cloudflare** (https://cloudflare.com) - Great for performance

Recommended domain: `pophabachi.com`

## Step 2: Verify Domain in Google Cloud

```bash
# Verify domain ownership
gcloud domains verify pophabachi.com
```

## Step 3: Map Domain to Cloud Run Frontend

```bash
# Map the domain to your frontend service
gcloud run domain-mappings create \
  --service chefweb-frontend \
  --domain pophabachi.com \
  --region us-central1

# Also map www subdomain
gcloud run domain-mappings create \
  --service chefweb-frontend \
  --domain www.pophabachi.com \
  --region us-central1
```

## Step 4: Get DNS Records

```bash
# Get the DNS records to add to your registrar
gcloud run domain-mappings describe \
  --domain pophabachi.com \
  --region us-central1
```

## Step 5: Configure DNS at Registrar

Add these records at your domain registrar:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | (IP from Cloud Run) | 300 |
| AAAA | @ | (IPv6 from Cloud Run) | 300 |
| CNAME | www | ghs.googlehosted.com | 300 |

## Step 6: Wait for SSL Certificate

Google Cloud Run automatically provisions an SSL certificate. This can take up to 24 hours.

Check status:
```bash
gcloud run domain-mappings describe \
  --domain pophabachi.com \
  --region us-central1
```

## Step 7: Update All URLs in Code

After domain is active, update these files:

### robots.txt
```
Sitemap: https://pophabachi.com/sitemap.xml
```

### sitemap.xml
Replace all instances of:
`https://chefweb-frontend-775848565797.us-central1.run.app`
With:
`https://pophabachi.com`

### index.html (and all other pages)
Update canonical URLs:
```html
<link rel="canonical" href="https://pophabachi.com/">
```

Update structured data:
```json
"url": "https://pophabachi.com/"
```

### api-config.js
If needed, update CORS settings on backend to allow the new domain.

## Step 8: Set Up 301 Redirects

Add to nginx.conf to redirect old Cloud Run URL to new domain:

```nginx
# Redirect old Cloud Run URL to new domain
if ($host = "chefweb-frontend-775848565797.us-central1.run.app") {
    return 301 https://pophabachi.com$request_uri;
}

# Redirect www to non-www (or vice versa)
if ($host = "www.pophabachi.com") {
    return 301 https://pophabachi.com$request_uri;
}
```

## Step 9: Update External Services

After domain is live, update:
- [ ] Google Search Console - Add new property
- [ ] Google Business Profile - Update website URL
- [ ] Google Analytics - Update property settings
- [ ] Social media profiles - Update website links
- [ ] Directory listings (Yelp, Facebook, etc.)

## Step 10: Verify Everything

1. Test all pages load with HTTPS
2. Test canonical URLs are correct
3. Test 301 redirects work
4. Test structured data with Google's Rich Results Test
5. Submit new sitemap to Search Console
6. Request re-indexing of key pages

---

## Quick Commands Reference

```bash
# List all domain mappings
gcloud run domain-mappings list --region us-central1

# Delete a domain mapping
gcloud run domain-mappings delete --domain pophabachi.com --region us-central1

# Check Cloud Run service
gcloud run services describe chefweb-frontend --region us-central1
```

## Estimated Timeline

| Step | Time |
|------|------|
| Domain purchase | 10 minutes |
| Domain verification | 1 hour |
| DNS propagation | 1-24 hours |
| SSL certificate | 15 min - 24 hours |
| Total | 1-48 hours |

---

*Last Updated: February 3, 2026*
