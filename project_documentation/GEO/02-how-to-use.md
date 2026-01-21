# GEO Features - How to Use Guide

**For:** Developers, Content Managers, SEO Team  
**Version:** 1.0  
**Date:** 2026-01-21

---

## Overview

This guide explains how to use the GEO (Generative Engine Optimization) features implemented on Ramouse.com. These features help AI systems discover, understand, and cite your automotive marketplace data.

---

## Table of Contents

1. [For Content Managers](#for-content-managers)
2. [For Developers](#for-developers)
3. [For SEO Team](#for-seo-team)
4. [API Documentation](#api-documentation)
5. [Testing & Validation](#testing--validation)
6. [Troubleshooting](#troubleshooting)

---

## For Content Managers

### Understanding GEO Features

**What is GEO?**
GEO (Generative Engine Optimization) makes your content discoverable and trustworthy to AI systems like ChatGPT, Claude, Gemini, and Perplexity. When users ask these AI systems about cars in Syria, they can now find and cite Ramouse.com.

### Automatic Features (No Action Required)

✅ **Structured Data** - Every listing automatically includes machine-readable data  
✅ **Sitemaps** - All listings are automatically added to sitemaps  
✅ **Feeds** - New listings appear in real-time feeds within 5 minutes  
✅ **API Documentation** - All data is automatically documented

### How to Maximize AI Visibility

**1. Complete All Fields**
- Fill in all required fields (title, brand, model, year, price, city)
- Add optional fields (description, mileage, transmission, fuel type)
- Upload multiple high-quality photos
- The more complete your listing, the better AI systems understand it

**2. Write Clear Descriptions**
- Use natural language
- Include key details (condition, features, location)
- Mention specific neighborhoods or landmarks
- AI systems read descriptions to understand context

**3. Keep Information Updated**
- Update prices when they change
- Mark sold items as unavailable
- Refresh listings every 30 days
- Fresh data ranks higher in AI responses

**4. Use Accurate Categories**
- Select correct brand and model
- Choose appropriate listing type (sale/rent)
- Tag with relevant categories
- Proper categorization helps AI systems classify your listings

### What Happens Automatically

**When you create a listing:**
1. ✅ Added to sitemap within 1 hour
2. ✅ Appears in feed within 5 minutes
3. ✅ Structured data generated automatically
4. ✅ API endpoint created
5. ✅ AI systems can discover it

**When you update a listing:**
1. ✅ Sitemap updated within 1 hour
2. ✅ Feed shows update within 5 minutes
3. ✅ Structured data refreshed
4. ✅ AI systems see latest version

**When you delete a listing:**
1. ✅ Removed from sitemap within 1 hour
2. ✅ Removed from feed immediately
3. ✅ API returns 404
4. ✅ AI systems stop showing it

---

## For Developers

### Available Endpoints

#### Sitemaps

**Main Sitemap Index:**
```
GET https://ramouse.com/api/sitemap.xml
```

**Entity-Specific Sitemaps:**
```
GET https://ramouse.com/api/sitemap/car-listings.xml
GET https://ramouse.com/api/sitemap/car-rentals.xml
GET https://ramouse.com/api/sitemap/car-providers.xml
GET https://ramouse.com/api/sitemap/technicians.xml
GET https://ramouse.com/api/sitemap/tow-trucks.xml
GET https://ramouse.com/api/sitemap/products.xml
```

**Response Format:** XML (Sitemap Protocol)  
**Cache:** 1 hour  
**Updates:** Automatic on entity changes

#### Feeds

**Real-Time Atom Feeds:**
```
GET https://ramouse.com/api/feed/car-listings.xml
GET https://ramouse.com/api/feed/car-rentals.xml
GET https://ramouse.com/api/feed/products.xml
```

**Response Format:** Atom 1.0 XML  
**Cache:** 5 minutes  
**Content:** Latest 50 items  
**Updates:** Near real-time

#### Entity Metadata

**Get Entity Data:**
```
GET https://ramouse.com/api/entity/{type}/{id}
```

**Get JSON-LD Metadata:**
```
GET https://ramouse.com/api/entity/{type}/{id}/metadata
```

**Supported Types:**
- `car-listing`
- `car-provider`
- `technician`
- `tow-truck`
- `product`

**Example:**
```bash
# Get car listing data
curl https://ramouse.com/api/entity/car-listing/123

# Get JSON-LD metadata
curl https://ramouse.com/api/entity/car-listing/123/metadata
```

**Response Includes:**
- Entity data
- HATEOAS links (self, metadata, web, related entities)
- Provenance headers

### Response Headers

All API responses include provenance headers:

```http
X-Data-Source: Ramouse.com
X-Data-Authority: primary
X-Data-Region: Syria
X-Last-Updated: 2026-01-21T03:00:00+03:00
X-Data-Freshness: real-time|hourly|near-real-time
X-API-Version: 1.0.0
X-Content-Language: ar,en
Cache-Control: public, max-age=<varies>
```

### HATEOAS Links

Entity responses include navigation links:

```json
{
  "id": 123,
  "title": "2020 Toyota Camry",
  // ... entity data ...
  "_links": {
    "self": {
      "href": "https://ramouse.com/api/entity/car-listing/123",
      "type": "application/json"
    },
    "metadata": {
      "href": "https://ramouse.com/api/entity/car-listing/123/metadata",
      "type": "application/ld+json",
      "title": "JSON-LD Structured Data"
    },
    "web": {
      "href": "https://ramouse.com/car-listings/2020-toyota-camry-abc",
      "type": "text/html",
      "title": "View on website"
    },
    "provider": {
      "href": "https://ramouse.com/api/entity/car-provider/456",
      "type": "application/json",
      "title": "Car provider"
    },
    "sitemap": {
      "href": "https://ramouse.com/api/sitemap/car-listings.xml",
      "type": "application/xml",
      "title": "Entity sitemap"
    }
  }
}
```

### Using Structured Data in Frontend

**Import the utility:**
```typescript
import { generateCarListingSchema } from '@/utils/structuredData';
import { StructuredData } from '@/components/shared';
```

**Generate schema:**
```typescript
const schema = generateCarListingSchema(listing);
```

**Inject into page:**
```tsx
<StructuredData data={schema} />
```

**Available generators:**
- `generateCarListingSchema(listing)` - Car sales
- `generateRentalSchema(listing)` - Car rentals
- `generateCarProviderSchema(provider)` - Dealerships
- `generateTechnicianSchema(technician)` - Repair shops
- `generateTowTruckSchema(towTruck)` - Towing
- `generateProductSchema(product)` - Spare parts
- `generateBreadcrumbSchema(items)` - Navigation
- `generateOrganizationSchema()` - Company info
- `generateWebsiteSchema()` - Search action

### API Documentation

**Swagger UI:**
```
https://ramouse.com/api/docs
```

**OpenAPI Spec (JSON):**
```
https://ramouse.com/docs/api-docs.json
```

**OpenAPI Spec (YAML):**
```
https://ramouse.com/docs/api-docs.yaml
```

### Cache Management

**Clear all caches:**
```bash
php artisan cache:clear
```

**Clear specific cache:**
```bash
php artisan cache:forget sitemap:car-listings
php artisan cache:forget feed:car-listings
```

**Regenerate OpenAPI docs:**
```bash
php artisan l5-swagger:generate
```

---

## For SEO Team

### Submit Sitemaps to Search Engines

#### Google Search Console

1. Go to https://search.google.com/search-console
2. Add property: `ramouse.com`
3. Verify ownership
4. Go to "Sitemaps" section
5. Submit: `https://ramouse.com/api/sitemap.xml`
6. Monitor indexing status

#### Bing Webmaster Tools

1. Go to https://www.bing.com/webmasters
2. Add site: `ramouse.com`
3. Verify ownership
4. Go to "Sitemaps" section
5. Submit: `https://ramouse.com/api/sitemap.xml`
6. Monitor indexing status

### Validate Structured Data

#### Google Rich Results Test

1. Go to https://search.google.com/test/rich-results
2. Enter listing URL (e.g., `https://ramouse.com/car-listings/...`)
3. Click "Test URL"
4. Check for valid Car schema
5. Fix any errors shown

#### Schema.org Validator

1. Go to https://validator.schema.org/
2. Open any listing page
3. View page source (Ctrl+U)
4. Copy JSON-LD script content
5. Paste into validator
6. Check for errors

#### Feed Validator

1. Go to https://validator.w3.org/feed/
2. Enter feed URL (e.g., `https://ramouse.com/api/feed/car-listings.xml`)
3. Click "Check"
4. Verify Atom 1.0 compliance

### Monitor AI Crawler Access

**Check server logs for these User-Agents:**
- `GPTBot` (OpenAI)
- `ChatGPT-User` (OpenAI)
- `CCBot` (Common Crawl)
- `anthropic-ai` (Claude)
- `Claude-Web` (Claude)
- `Google-Extended` (Google AI)
- `PerplexityBot` (Perplexity)
- `Applebot-Extended` (Apple)

**Track these URLs:**
- `/api/sitemap.xml`
- `/api/sitemap/*.xml`
- `/api/feed/*.xml`
- `/api/entity/*`

### Performance Metrics

**Monitor:**
- Sitemap access frequency
- Feed subscription count
- API endpoint usage
- Cache hit/miss ratios
- Response times

**Expected Values:**
- Sitemap: <100ms (cached), <500ms (uncached)
- Feed: <100ms (cached), <300ms (uncached)
- Entity: <50ms

---

## API Documentation

### Interactive Documentation

Visit the Swagger UI for interactive API documentation:

**URL:** https://ramouse.com/api/docs

**Features:**
- Try API endpoints directly
- See request/response examples
- View parameter descriptions
- Test authentication
- Download OpenAPI spec

### Example Requests

**Get sitemap:**
```bash
curl https://ramouse.com/api/sitemap.xml
```

**Get feed:**
```bash
curl https://ramouse.com/api/feed/car-listings.xml
```

**Get entity with headers:**
```bash
curl -I https://ramouse.com/api/entity/car-listing/123
```

**Get JSON-LD metadata:**
```bash
curl https://ramouse.com/api/entity/car-listing/123/metadata
```

**Get entity with HATEOAS links:**
```bash
curl https://ramouse.com/api/entity/car-listing/123 | jq '._links'
```

---

## Testing & Validation

### Quick Test Checklist

**Sitemaps:**
- [ ] Main sitemap loads: `/api/sitemap.xml`
- [ ] All sub-sitemaps load
- [ ] Contains recent listings
- [ ] Image tags present
- [ ] Valid XML format

**Feeds:**
- [ ] All feeds load
- [ ] Contains latest 50 items
- [ ] Updates within 5 minutes
- [ ] Valid Atom format
- [ ] Full content included

**Structured Data:**
- [ ] JSON-LD in page source
- [ ] Valid Schema.org format
- [ ] All required fields present
- [ ] Passes Google Rich Results Test
- [ ] Passes Schema.org Validator

**API:**
- [ ] Swagger UI loads
- [ ] All endpoints documented
- [ ] Provenance headers present
- [ ] HATEOAS links included
- [ ] Cache headers correct

### Validation Tools

**Google Rich Results Test:**
```
https://search.google.com/test/rich-results
```

**Schema.org Validator:**
```
https://validator.schema.org/
```

**Feed Validator:**
```
https://validator.w3.org/feed/
```

**OpenAPI Validator:**
```
https://apitools.dev/swagger-parser/online/
```

---

## Troubleshooting

### Common Issues

**Q: Sitemap shows old data**  
A: Cache hasn't expired yet (1 hour TTL). Wait or clear cache manually:
```bash
php artisan cache:clear
```

**Q: New listing not in feed**  
A: Feed cache is 5 minutes. Wait a few minutes or clear cache.

**Q: JSON-LD not appearing on page**  
A: Check:
1. Component is imported
2. Helmet is installed
3. Browser console for errors

**Q: Swagger UI not loading**  
A: Try:
```bash
php artisan config:clear
php artisan l5-swagger:generate
```

**Q: 404 on sitemap**  
A: Clear route cache:
```bash
php artisan route:clear
```

**Q: Validation errors in Rich Results Test**  
A: Check:
1. All required fields filled
2. Valid data types (numbers, dates)
3. Proper Schema.org type

### Getting Help

**Check logs:**
```bash
tail -f storage/logs/laravel.log
```

**Check cache:**
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

**Regenerate docs:**
```bash
php artisan l5-swagger:generate
```

---

## Best Practices

### For Maximum AI Visibility

**1. Data Quality**
- Complete all fields
- Use accurate information
- Update regularly
- Add high-quality photos

**2. Content**
- Write clear descriptions
- Use natural language
- Include location details
- Mention key features

**3. Freshness**
- Update prices promptly
- Mark sold items
- Refresh old listings
- Keep inventory current

**4. Consistency**
- Use standard formats
- Follow naming conventions
- Maintain data accuracy
- Verify information

### For Developers

**1. Caching**
- Respect cache TTLs
- Don't clear cache unnecessarily
- Monitor cache performance
- Use cache tags appropriately

**2. API Usage**
- Follow HATEOAS links
- Check provenance headers
- Handle 404s gracefully
- Respect rate limits

**3. Structured Data**
- Use provided generators
- Don't modify schemas manually
- Test with validators
- Keep schemas updated

---

## FAQ

**Q: How often are sitemaps updated?**  
A: Automatically within 1 hour of any listing change.

**Q: How often are feeds updated?**  
A: Automatically within 5 minutes of any listing change.

**Q: Can I access the API programmatically?**  
A: Yes, all endpoints are public and read-only. No authentication required.

**Q: What data is exposed via API?**  
A: Only public data (published listings, verified providers, active entities).

**Q: How do I know if AI systems are accessing my data?**  
A: Check server logs for AI crawler User-Agents (GPTBot, Claude-Web, etc.).

**Q: Can I customize the structured data?**  
A: No, schemas are automatically generated to ensure Schema.org compliance.

**Q: What if I find an error in the API?**  
A: Contact the development team with details.

**Q: How do I add a new entity type?**  
A: Contact the development team - requires code changes.

---

## Resources

### Documentation
- Technical Documentation: `01-what-was-implemented.md`
- Implementation Plan: `geo_implementation_plan.md`
- Layer 5 Plan: `layer5_implementation_plan.md`

### External Links
- OpenAPI Spec: https://spec.openapis.org/oas/v3.1.0
- Schema.org: https://schema.org/
- Sitemap Protocol: https://www.sitemaps.org/
- Atom Spec: https://datatracker.ietf.org/doc/html/rfc4287

### Support
- Development Team: [contact info]
- SEO Team: [contact info]
- Documentation: `project_documentation/GEO/`

---

**Last Updated:** 2026-01-21  
**Version:** 1.0  
**Maintained By:** Development Team
