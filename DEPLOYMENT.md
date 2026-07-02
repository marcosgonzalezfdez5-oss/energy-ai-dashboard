# Deployment Guide

## Overview

Solar Operations Intelligence can be deployed to Vercel with one-click integration for Next.js applications. The application uses Supabase for database and authentication, so no additional infrastructure setup is needed.

## Prerequisites

1. **Vercel Account** - Sign up at https://vercel.com
2. **GitHub Repository** - Code must be on GitHub
3. **Supabase Project** - Database and auth configured
4. **Environment Variables** - Collected and ready

## Step 1: Prepare Environment Variables

Gather all required environment variables from your Supabase project:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here
OPENAI_API_KEY=sk-your-openai-key-here
```

**Where to find these:**
- Supabase URL & Keys: Supabase Dashboard → Settings → API → Project URL and Keys
- OpenAI Key: OpenAI Dashboard → API Keys

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select the GitHub repository `marcosgonzalezfdez5-oss/energy-ai-dashboard`
4. Configure project:
   - **Project Name**: `solar-operations-intelligence` (or your choice)
   - **Framework**: Select "Next.js"
   - **Root Directory**: `./` (default)
5. Click "Environment Variables" and add all variables from Step 1
6. Click "Deploy"

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd energy-ai-dashboard
vercel --prod

# Follow prompts to:
# - Link to existing Vercel project or create new
# - Add environment variables
# - Confirm deployment
```

### Option C: Via GitHub Integration

1. Push code to GitHub repository
2. Go to https://vercel.com/new
3. Import from GitHub (auto-finds your repo)
4. Add environment variables
5. Deploy

## Step 3: Post-Deployment Configuration

### Database RLS Policies

Ensure Supabase RLS policies are enabled:

```sql
-- Enable RLS on plants table
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

-- Policy: Users see only their company's plants
CREATE POLICY "company_isolation" ON plants
  FOR SELECT
  USING (company_id = (
    SELECT company_id 
    FROM auth.users 
    WHERE id = auth.uid()
  )::uuid
);

-- Enable RLS on hourly_metrics
ALTER TABLE hourly_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Users see metrics for their company's plants
CREATE POLICY "user_metrics_access" ON hourly_metrics
  FOR SELECT
  USING (
    plant_id IN (
      SELECT id FROM plants 
      WHERE company_id = (
        SELECT company_id 
        FROM auth.users 
        WHERE id = auth.uid()
      )::uuid
    )
  );

-- Enable RLS on monthly_costs (admin only)
ALTER TABLE monthly_costs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins see financial data
CREATE POLICY "admin_costs_access" ON monthly_costs
  FOR SELECT
  USING (
    plant_id IN (
      SELECT id FROM plants 
      WHERE company_id = (
        SELECT company_id 
        FROM auth.users 
        WHERE id = auth.uid()
      )::uuid
    )
    AND (
      SELECT role FROM auth.users 
      WHERE id = auth.uid()
    ) = 'admin'
  );
```

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Project Settings → Domains
2. Add your custom domain (e.g., `solar.yourdomain.com`)
3. Update DNS records according to Vercel's instructions
4. Wait for DNS propagation (usually 24-48 hours)

### Staging Environment

Create a staging deployment for testing before production:

```bash
# Deploy to staging (default)
vercel --target production

# Or use automatic preview deployments on pull requests
# (Already enabled by default in Vercel)
```

## Step 4: Verification

### Smoke Tests

After deployment, verify:

1. **Landing Page**
   ```
   https://your-deployment.vercel.app/
   - Should show Solar Operations Intelligence landing page
   ```

2. **Authentication**
   ```
   - Sign up: https://your-deployment.vercel.app/auth/signup
   - Sign in: https://your-deployment.vercel.app/auth/signin
   ```

3. **Dashboard**
   ```
   - After login: https://your-deployment.vercel.app/dashboard
   - Should show plant dashboard with sidebar
   ```

4. **API Endpoints**
   ```bash
   # Get plants (requires authentication)
   curl -H "Authorization: Bearer $TOKEN" \
     https://your-deployment.vercel.app/api/plants
   
   # Get metrics
   curl -H "Authorization: Bearer $TOKEN" \
     https://your-deployment.vercel.app/api/plants/[plant-id]/metrics
   ```

## Step 5: Monitoring

### Enable Analytics

1. Vercel Dashboard → Project → Analytics
2. Enable "Web Analytics" and "Edge Metrics"
3. View real-time performance and traffic

### Set Up Error Tracking

Recommended services:
- **Sentry**: https://sentry.io
  - Create account, get DSN
  - Add to `next.config.js`:
    ```javascript
    import * as Sentry from "@sentry/nextjs";
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
    });
    ```

- **LogRocket**: https://logrocket.com (optional)

### Database Monitoring

In Supabase Dashboard:
- Monitor query performance
- Check database size
- Set up alerts for high CPU/memory

## Scaling Considerations

### Database Scaling

For production with high volume:

1. **Read Replicas**: Supabase → Database → Read Replicas
2. **Caching**: Implement Redis caching for frequent queries
3. **Query Optimization**: Index commonly filtered columns:
   ```sql
   CREATE INDEX idx_plants_company ON plants(company_id);
   CREATE INDEX idx_metrics_plant ON hourly_metrics(plant_id, timestamp);
   ```

### Function Scaling

- Next.js automatically scales with Vercel serverless functions
- Monitor function execution time in Vercel Analytics
- Optimize slow queries and add caching

### CDN & Static Assets

- Vercel automatically serves images via CDN
- Use Next.js Image component for optimization:
  ```tsx
  import Image from 'next/image';
  <Image src="/logo.png" alt="logo" width={200} height={200} />
  ```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| 500 errors after deploy | Check environment variables in Vercel Settings |
| Login fails | Verify Supabase auth is enabled and CORS configured |
| Charts not loading | Check data API endpoints are returning valid JSON |
| Slow performance | Check database query performance in Supabase |
| Environment variables missing | Redeploy: `vercel --prod --force` |

### Debug Mode

Enable debug logging:

```bash
# Set debug env var in Vercel
DEBUG=next-supabase:* vercel env pull

# View Vercel logs
vercel logs https://your-deployment.vercel.app --tail
```

## Rollback Procedure

If critical issues occur:

1. **Quick Rollback**:
   ```bash
   # Rollback to previous deployment
   vercel rollback
   ```

2. **Manual Rollback**:
   - Vercel Dashboard → Deployments
   - Find stable deployment
   - Click three dots → "Promote to Production"

3. **Database Backup**:
   - Supabase Dashboard → Backups
   - Restore from previous backup if needed

## Security Checklist

- [ ] Environment variables are never logged
- [ ] Sensitive data encrypted at rest (Supabase default)
- [ ] API keys not exposed in client code
- [ ] RLS policies enforce access control
- [ ] HTTPS enabled (Vercel automatic)
- [ ] Rate limiting enabled on API (if using API routes)
- [ ] CORS properly configured for your domain
- [ ] Regular security audits scheduled

## Cost Estimation

**Typical Production Costs:**
- Vercel: $20-50/month (with Hobby tier free for prototypes)
- Supabase: $25-100+/month (based on usage)
- OpenAI API: $0.01-1.00/month (based on chatbot usage)
- **Total**: ~$50-150/month for small-medium deployment

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Chat Support**: Available in Vercel dashboard for Pro plans

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Configure environment variables
3. ✅ Set up RLS policies
4. ✅ Run smoke tests
5. ✅ Enable monitoring
6. ✅ Set up alerts
7. ✅ Document deployment process
8. ✅ Train team on maintenance

---

**Deployment Date**: ___________
**Deployed Version**: ___________
**Deployed By**: ___________
