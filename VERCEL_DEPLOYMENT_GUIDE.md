# Vercel Deployment Guide for DrugScan

## Overview
This application is now optimized for serverless deployment on Vercel. The refactoring eliminates the medication loading bottleneck that was causing 500 errors.

## Prerequisites
✅ Medications are already in the PostgreSQL database (131,000+ records)
✅ Database schema is up to date (run `npm run db:push` if needed)
✅ Environment variables are configured on Vercel

## Required Environment Variables on Vercel

### Database Connection
```
DATABASE_URL=postgresql://neondb_owner:npg_kUa...@...neon.tech/neondb
```

### Optional
```
JWT_SECRET=your-secret-jwt-key-change-in-production
```

## One-Time Database Setup (If Not Already Done)

If your Vercel database doesn't have medications yet, run this script locally once:

```bash
# Create a seed script: scripts/seed-medications.ts
import { db } from './server/db';
import { medicationsDatabase } from './server/medications-database';
import { medications } from './shared/schema';
import { randomUUID } from 'crypto';

async function seedMedications() {
  console.log('Seeding medications...');
  const batchSize = 1000;
  const meds = medicationsDatabase.map(med => ({
    ...med,
    id: randomUUID()
  }));
  
  for (let i = 0; i < meds.length; i += batchSize) {
    const batch = meds.slice(i, i + batchSize);
    await db.insert(medications).values(batch);
    console.log(`Inserted ${i + batchSize}/${meds.length}`);
  }
  
  console.log('✅ Seeding complete!');
}

seedMedications().catch(console.error);
```

Run it locally (pointing to your Vercel database):
```bash
DATABASE_URL="your-vercel-db-url" npx tsx scripts/seed-medications.ts
```

## Key Improvements

### Before Refactoring (Broken on Vercel)
- ❌ Loaded 199,954 medications into memory on every cold start
- ❌ Server startup took 60+ seconds
- ❌ Exceeded Vercel's 10-second timeout limit
- ❌ Login endpoint failed with 500 errors
- ❌ Memory exceeded serverless limits

### After Refactoring (Works on Vercel)
- ✅ Server starts in <1 second
- ✅ No medication loading on startup
- ✅ Authentication works immediately
- ✅ Medications queried from database on demand
- ✅ Graceful error handling (returns empty arrays, not crashes)
- ✅ Retry logic with exponential backoff for database connections

## How It Works

### Fast Startup
```typescript
// OLD (broken on Vercel):
constructor() {
  this.initializeMedications().catch(console.error); // 60+ seconds
}

// NEW (works on Vercel):
constructor() {
  console.log("✅ Storage initialized - authentication ready"); // <1 second
}
```

### Database-Only Medications
All medication queries go directly to the database with graceful fallbacks:
- `getMedication()` → Returns undefined if DB unavailable
- `searchMedications()` → Returns empty array if DB unavailable
- No in-memory fallback → Prevents memory exhaustion

### Resilient User Authentication
User auth has in-memory fallback for maximum resilience:
- Database connection retries (3 attempts with exponential backoff)
- Falls back to in-memory for guests if database is temporarily down
- Doesn't permanently disable database after transient errors

## Deployment Steps

1. **Set Environment Variables on Vercel**
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL` (your Neon PostgreSQL connection string)
   - Add `JWT_SECRET` (optional, defaults to dev key)

2. **Deploy to Vercel**
   ```bash
   vercel deploy --prod
   ```

3. **Verify**
   - Check login works: `https://your-app.vercel.app/`
   - Check search works: Try searching for a medication
   - Monitor logs for any database connection issues

## Troubleshooting

### "Medication query attempted without database connection"
**Cause**: Database not reachable from Vercel
**Fix**: Verify DATABASE_URL is correct and database allows connections from Vercel IPs

### Login works but search returns empty
**Cause**: Medications not seeded in database
**Fix**: Run the seed script (see One-Time Database Setup above)

### Still getting timeouts
**Cause**: Database cold start taking too long
**Fix**: Upgrade to Neon's paid tier for instant wake-up

## Monitoring

Watch Vercel logs for:
- `✅ Database connection established successfully` - Good!
- `❌ All database connection attempts failed` - Database issue
- `Medication query attempted without database connection` - Verify DATABASE_URL

## Success Indicators

✅ Server logs show "✅ Storage initialized - authentication ready"
✅ Login page loads in <1 second
✅ Authentication works immediately
✅ Medication search returns results
✅ No 500 errors on cold starts
