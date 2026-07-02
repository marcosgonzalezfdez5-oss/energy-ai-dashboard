# Testing & Deployment Checklist

## Pre-Deployment Testing

### Authentication & Authorization
- [ ] Sign up as new user with Admin role
- [ ] Sign up as new user with Operator role
- [ ] Verify admin and operator are assigned to correct company
- [ ] Test sign-in with valid credentials
- [ ] Test sign-in with invalid credentials (should fail)
- [ ] Test session persistence (refresh page, should stay logged in)
- [ ] Test sign out functionality
- [ ] Verify middleware redirects unauthenticated users to home page

### RBAC & Data Access
- [ ] **Admin User**:
  - [ ] Can view all plant metrics (energy, power, irradiance, insolation, temperature)
  - [ ] Can access monthly costs data
  - [ ] Can access energy price data
  - [ ] Can view all plants from their company
  - [ ] Cannot see plants from other companies
  
- [ ] **Operator User**:
  - [ ] Can view operational metrics (energy, power, irradiance, insolation, temperature)
  - [ ] Cannot access monthly costs endpoint (should return 403)
  - [ ] Cannot access energy price endpoint (should return 403)
  - [ ] Can view all plants from their company
  - [ ] Cannot see plants from other companies

### Dashboard & UI
- [ ] Landing page displays correctly with branding
- [ ] Dashboard sidebar displays correct plant list
- [ ] Plant selector dropdown works
- [ ] Date range picker filters data correctly
- [ ] Metric cards display with proper formatting
- [ ] Charts render with actual data
- [ ] Moving average lines display correctly on charts
- [ ] Responsive design works on mobile (375px) viewport
- [ ] Responsive design works on tablet (768px) viewport
- [ ] Responsive design works on desktop (1920px) viewport
- [ ] Dark mode toggle works (if enabled)

### Plant Comparison Page
- [ ] Can select multiple plants to compare
- [ ] Comparison charts display metrics for all selected plants
- [ ] Date range filtering works on comparison page
- [ ] Chart legends display plant names correctly

### Chatbot
- [ ] Chat page loads correctly
- [ ] Can send text messages
- [ ] Chatbot responds to plant data queries
- [ ] Operator cannot get financial data from chatbot
- [ ] Admin can get financial data from chatbot
- [ ] Conversation history displays correctly
- [ ] Can create new conversation
- [ ] Typing indicator shows while waiting for response

### API Endpoints
- [ ] `GET /api/plants` returns plants for user's company only
- [ ] `GET /api/plants/[id]/metrics` returns hourly metrics
- [ ] `GET /api/plants/[id]/metrics?startDate=X&endDate=Y` filters by date range
- [ ] `GET /api/plants/[id]/monthly-costs` returns 403 for operators
- [ ] `GET /api/plants/[id]/monthly-costs` returns data for admins
- [ ] `POST /api/chat` accepts messages and returns responses
- [ ] API returns proper error messages for unauthorized access

### Data Integrity
- [ ] Metrics data displays with correct precision
- [ ] Timestamps are formatted correctly
- [ ] No data leakage between companies
- [ ] No data leakage between user roles
- [ ] Financial data is never exposed to operators

## Performance Testing

### Web Vitals
- [ ] Largest Contentful Paint (LCP) < 2.5s on desktop
- [ ] Interaction to Next Paint (INP) < 200ms
- [ ] Cumulative Layout Shift (CLS) < 0.1
- [ ] First Contentful Paint (FCP) < 1.8s

### Load Testing
- [ ] Dashboard loads with < 50 plants
- [ ] Dashboard loads with < 1000 hourly metrics
- [ ] Comparison page works with 5+ plants
- [ ] API responds within 500ms for typical queries

## Browser & Device Compatibility

- [ ] Chrome/Chromium latest
- [ ] Firefox latest
- [ ] Safari latest
- [ ] Edge latest
- [ ] iPhone Safari
- [ ] Android Chrome

## Security Testing

- [ ] XSS vulnerability check: test input fields with `<script>alert('xss')</script>`
- [ ] SQL injection check: test API with malicious SQL strings
- [ ] CSRF tokens present on forms (if applicable)
- [ ] Sensitive data not logged to console
- [ ] JWT tokens handled securely (not exposed in URLs)
- [ ] API keys not exposed in client-side code
- [ ] Rate limiting works on API endpoints (optional)

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No console warnings
- [ ] Environment variables configured in Vercel
- [ ] Database migrations complete
- [ ] RLS policies enabled on Supabase
- [ ] All static assets optimized
- [ ] Git branch up to date with main

### Deployment Steps
1. [ ] Trigger deployment in Vercel
2. [ ] Wait for build to complete
3. [ ] Check build logs for errors
4. [ ] Preview deployment URL working
5. [ ] Run smoke tests on preview
6. [ ] Promote to production
7. [ ] Verify production URL
8. [ ] Check monitoring/error tracking

### Post-Deployment
- [ ] Monitor error rates for 24 hours
- [ ] Check Web Vitals in production
- [ ] Verify user authentication flows
- [ ] Test admin and operator flows end-to-end
- [ ] Check database performance
- [ ] Review server logs for errors
- [ ] Get user feedback

## Documentation & Handoff

- [ ] README.md updated with latest features
- [ ] API documentation complete
- [ ] RBAC permissions documented
- [ ] Deployment instructions documented
- [ ] Known issues documented
- [ ] Future improvements identified
- [ ] Team trained on maintenance

## Monitoring & Maintenance

### Production Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Set up database performance monitoring
- [ ] Set up API performance monitoring
- [ ] Set up user analytics

### Regular Maintenance
- [ ] Weekly: Check error logs
- [ ] Weekly: Review Web Vitals
- [ ] Monthly: Database optimization
- [ ] Monthly: Dependency updates
- [ ] Quarterly: Security audit

## Rollback Plan

If critical issues occur in production:
1. [ ] Document the issue in detail
2. [ ] Identify affected users
3. [ ] Create rollback commit
4. [ ] Deploy previous stable version
5. [ ] Notify stakeholders
6. [ ] Root cause analysis
7. [ ] Fix and re-deploy

## Sign-Off

- [ ] Product Owner: Approved for deployment
- [ ] Tech Lead: Code reviewed and tested
- [ ] DevOps: Infrastructure ready
- [ ] Security: Security review complete
- [ ] QA: Testing checklist complete

**Date**: ___________
**Version**: ___________
**Deployed By**: ___________
