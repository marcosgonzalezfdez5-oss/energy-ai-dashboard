# Getting Started with Solar Operations Intelligence

## Installation & Setup

### 1. Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Supabase account (free tier works)
- Git (optional, for version control)

### 2. Clone the Repository
```bash
git clone <repository-url>
cd solar-operations-intelligence
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure Supabase

#### Create a Supabase Project
1. Go to https://supabase.com
2. Create a new project
3. Note your project URL and API keys

#### Set Environment Variables
Create a `.env.development.local` file in the project root:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

#### Create Database Tables
Run this SQL in your Supabase SQL editor:

```sql
-- Create plants table
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity_kw NUMERIC NOT NULL,
  commissioned_date TIMESTAMP NOT NULL,
  company_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Create hourly_metrics table
CREATE TABLE hourly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id),
  timestamp TIMESTAMP NOT NULL,
  energy_produced_kwh NUMERIC NOT NULL,
  power_output_kw NUMERIC NOT NULL,
  insolation_kwh_m2 NUMERIC NOT NULL,
  irradiance_w_m2 NUMERIC NOT NULL,
  temperature_celsius NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Create monthly_costs table
CREATE TABLE monthly_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id),
  month TEXT NOT NULL,
  cost_amount NUMERIC NOT NULL,
  energy_price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Enable RLS
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_costs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for plants
CREATE POLICY "Users can view their company plants" ON plants
FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

-- Create RLS policies for hourly_metrics
CREATE POLICY "Users can view their company metrics" ON hourly_metrics
FOR SELECT USING (
  plant_id IN (SELECT id FROM plants WHERE company_id = auth.jwt() ->> 'company_id')
);

-- Create RLS policies for monthly_costs (admin only)
CREATE POLICY "Only admins can view monthly costs" ON monthly_costs
FOR SELECT USING (
  (plant_id IN (SELECT id FROM plants WHERE company_id = auth.jwt() ->> 'company_id'))
  AND (auth.jwt() ->> 'role' = 'admin')
);

-- Create indexes for performance
CREATE INDEX idx_plants_company_id ON plants(company_id);
CREATE INDEX idx_hourly_metrics_plant_id ON hourly_metrics(plant_id);
CREATE INDEX idx_hourly_metrics_timestamp ON hourly_metrics(timestamp);
CREATE INDEX idx_monthly_costs_plant_id ON monthly_costs(plant_id);
```

#### Insert Sample Data (Optional)
```sql
-- Insert sample plants
INSERT INTO plants (name, location, capacity_kw, commissioned_date, company_id) VALUES
('Plant C1-001', 'North', 1200, '2021-03-01', 'company_1'),
('Plant C1-002', 'South', 800, '2021-06-15', 'company_1'),
('Plant C2-001', 'East', 1500, '2020-09-01', 'company_2');

-- Insert sample metrics for today
INSERT INTO hourly_metrics (plant_id, timestamp, energy_produced_kwh, power_output_kw, insolation_kwh_m2, irradiance_w_m2, temperature_celsius)
SELECT 
  plants.id,
  now() - (interval '1 hour' * (generate_series(0, 23))),
  (RANDOM() * 100 + 50)::NUMERIC,
  (RANDOM() * 1000 + 500)::NUMERIC,
  (RANDOM() * 1 + 0.2)::NUMERIC,
  (RANDOM() * 800 + 200)::NUMERIC,
  (RANDOM() * 10 + 20)::NUMERIC
FROM plants
CROSS JOIN generate_series(0, 23);

-- Insert sample monthly costs
INSERT INTO monthly_costs (plant_id, month, cost_amount, energy_price)
SELECT 
  plants.id,
  '2026-07',
  (RANDOM() * 5000 + 10000)::NUMERIC,
  (RANDOM() * 0.5 + 0.1)::NUMERIC
FROM plants;
```

### 5. Start the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## First Time User Guide

### Sign Up
1. Navigate to http://localhost:3000
2. Click "Create an account"
3. Fill in your email and password
4. Select your company (Company 1 or Company 2)
5. Select your role (Admin or Operator)
6. Click "Create account"

### Sign In
1. Click "Sign in with Email"
2. Enter your credentials
3. You'll be redirected to the dashboard

### Explore the Dashboard

#### View Plant Dashboard
1. Click "Plants" in the sidebar
2. Select a plant from the dropdown
3. Adjust the date range if needed
4. View the metrics cards with charts

#### Compare Plants
1. Click "Plant Comparison" in the sidebar
2. See bar charts comparing all your plants
3. Check the efficiency percentages

#### Chat with AI Assistant
1. Click "AI Assistant" in the sidebar
2. Ask questions about your plants
3. Try these sample questions:
   - "Hello"
   - "How much energy did my plants produce?"
   - "What's the power output?"
   - (Operators) "Show me the costs" (will be rejected)

## Testing RBAC Features

### Create Test Users

#### Admin User
- Email: `admin@company1.com`
- Password: `TestPassword123!`
- Role: Admin
- Company: Company 1

#### Operator User
- Email: `operator@company1.com`
- Password: `TestPassword123!`
- Role: Operator
- Company: Company 1

### Verify Access Control

#### Admin Should See:
- ✓ All operational metrics
- ✓ Monthly costs
- ✓ Energy price data
- ✓ Financial information in chat

#### Operator Should See:
- ✓ Operational metrics (energy, power, temperature, irradiance, insolation)
- ✗ Monthly costs (shows "Restricted for operators")
- ✗ Energy price (shows "Restricted for operators")
- ✗ Financial data in chat (chat responds with access denied)

### Test Company Isolation
1. Create users in Company 1 and Company 2
2. Log in as Company 1 user → should see only Company 1 plants
3. Log in as Company 2 user → should see only Company 2 plants
4. API test: Try accessing Company 2 plant as Company 1 user → should fail

## Common Tasks

### Add a New Plant
1. In Supabase dashboard, go to Plants table
2. Click "Insert row"
3. Fill in:
   - name: "Plant Name"
   - location: "Location"
   - capacity_kw: 1000
   - commissioned_date: Today's date
   - company_id: "company_1"
4. Refresh the dashboard to see the new plant

### Add Hourly Metrics
```sql
INSERT INTO hourly_metrics (plant_id, timestamp, energy_produced_kwh, power_output_kw, insolation_kwh_m2, irradiance_w_m2, temperature_celsius)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Replace with actual plant_id
  now(),
  150.5,
  750.0,
  0.8,
  650.0,
  25.5
);
```

### View Logs
```bash
# Terminal where dev server is running shows errors and logs
# Browser DevTools console also shows client-side errors
```

## Troubleshooting

### Issue: "Missing environment variables"
**Solution**: Check that `.env.development.local` exists with all three Supabase keys

### Issue: "Cannot read plants" 
**Solution**: Verify RLS policies are created and Supabase tables exist with correct schema

### Issue: "401 Unauthorized" on API calls
**Solution**: Ensure you're signed in and JWT is valid. Check browser console for auth errors

### Issue: "403 Forbidden" on financial endpoints as operator
**This is expected!** Operators intentionally cannot access financial data

### Issue: Charts not showing data
**Solution**: 
1. Verify you have hourly_metrics data for the selected date range
2. Check that plant_id in metrics matches the plant you selected
3. Try expanding the date range

### Issue: "Cannot POST /api/chat"
**Solution**: This is normal - the chat API is a stub. Implement full OpenAI integration as needed

## Next Steps

### Customize the Application
1. **Branding**: Update company name in `app/page.tsx`
2. **Colors**: Modify `app/globals.css` and `tailwind.config.ts`
3. **Metrics**: Add new metric types in `components/MetricCard.tsx`

### Deploy to Production
1. Push code to GitHub
2. Connect Vercel project
3. Set environment variables in Vercel
4. Deploy with `git push`

### Add Advanced Features
- Real-time updates with Supabase subscriptions
- Advanced analytics and machine learning
- Export reports as PDF/CSV
- Mobile app with React Native
- Email alerts for anomalies

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Recharts**: https://recharts.org

## Architecture Overview

```
┌─────────────────────────────────────────┐
│   Browser / Client (Next.js SPA)        │
│  - React components                      │
│  - Charts (Recharts)                     │
│  - RBAC filtering                        │
└─────────────────────────────────────────┘
           ↓ HTTPS ↓
┌─────────────────────────────────────────┐
│   Next.js Server (App Router)           │
│  - API routes with RBAC middleware      │
│  - Route protection                      │
│  - JWT validation                        │
└─────────────────────────────────────────┘
           ↓ Secure ↓
┌─────────────────────────────────────────┐
│   Supabase Backend                      │
│  - PostgreSQL database                  │
│  - Row-Level Security (RLS)             │
│  - Authentication service               │
│  - JWT token validation                 │
└─────────────────────────────────────────┘
```

## Performance Tips

- Keep date ranges reasonable (< 90 days) for better chart performance
- Use the plant selector to focus on individual plants
- Clear browser cache if you see stale data
- Monitor API response times in browser DevTools

Happy building! 🚀
