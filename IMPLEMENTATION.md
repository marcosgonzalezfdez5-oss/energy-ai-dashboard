# Solar Operations Intelligence - Implementation Guide

## Overview

Solar Operations Intelligence is a Next.js-based SaaS platform for monitoring and analyzing solar energy plants. It implements a comprehensive Role-Based Access Control (RBAC) system with multi-tenant support, real-time dashboards, and AI-powered analytics.

## Architecture

### Tech Stack
- **Framework**: Next.js 16 with App Router
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **UI Components**: shadcn/ui + Tailwind CSS v4
- **Charts**: Recharts
- **AI**: Eve framework (durable agents) + OpenAI LLM
- **API**: RESTful with RBAC enforcement

### Project Structure
```
app/
├── api/                          # API endpoints with RBAC
│   ├── chat/                    # AI chatbot endpoint
│   └── plants/                  # Plant data endpoints
├── auth/                        # Authentication pages
│   ├── signin/
│   └── signup/
├── dashboard/                   # Protected dashboard
│   ├── plants/                 # Plant dashboard with charts
│   ├── comparison/             # Multi-plant comparison
│   ├── chat/                   # AI assistant interface
│   └── layout.tsx              # Dashboard shell
├── globals.css                 # Tailwind + theme
└── layout.tsx                  # Root layout

components/
├── PlantDashboard.tsx          # Main dashboard container
├── MetricCard.tsx              # Chart component with role filtering
└── PlantSelector.tsx           # Plant dropdown selector

lib/
├── auth.ts                     # User context & auth utilities
├── rbac.ts                     # Role-based access control
└── supabase.ts                 # Database queries & aggregation

middleware.ts                   # Route protection
```

## RBAC Implementation

### Multi-Tenant Architecture

**Company Isolation**
- All users belong to exactly one company
- Users can only access data from their company via `company_id` field
- Supabase RLS policies enforce company-scoped access at the database level
- Every query automatically filters by `user.company_id`

### User Roles & Permissions

#### Admin Role
- **Full data access** across the company
- Accessible metrics:
  - Energy produced (kWh)
  - Power output (kW)
  - Insolation (kWh/m²)
  - Irradiance (W/m²)
  - Temperature (°C)
  - Monthly costs
  - Energy price
- All pages and features accessible
- Financial reports available

#### Operator Role
- **Limited to operational metrics only**
- Accessible metrics:
  - Energy produced (kWh)
  - Power output (kW)
  - Insolation (kWh/m²)
  - Irradiance (W/m²)
  - Temperature (°C)
- Restricted from viewing:
  - Monthly costs ✗
  - Energy price ✗
- Cannot access financial reports
- Chat/AI responses filtered to exclude financial data

### Implementation Layers

#### 1. User Context Extraction (`lib/auth.ts`)
```typescript
// Extract user info from Supabase JWT
async function getUserContext(): Promise<UserContext>
// Returns: { userId, companyId, role }
```

#### 2. Database Row-Level Security (RLS)
Supabase RLS policies automatically enforce:
```sql
-- Plants: Users see only plants from their company
plants.company_id = auth.jwt() ->> 'company_id'

-- Monthly costs: Admin only (checked at RLS + API level)
(monthly_costs.plant_id IN (
  SELECT id FROM plants WHERE company_id = auth.jwt() ->> 'company_id'
) AND auth.jwt() ->> 'role' = 'admin')
```

#### 3. API Route Protection (`lib/rbac.ts`)
```typescript
// Middleware for route handlers
withRoleCheck(handler, ['admin']) // Enforces admin-only access

// Field-level access control
canAccessField(fieldName, role) // Returns true/false
```

#### 4. Component-Level Filtering
```typescript
// MetricCard automatically hides restricted data
{isAccessible ? <Chart /> : <RestrictedPlaceholder />}
```

### Data Access Flow

```
User Request
    ↓
[Authentication Check] → Supabase JWT
    ↓
[Role Extraction] → Extract role from JWT metadata
    ↓
[Route Handler] → Check role permissions
    ↓
[RLS Policies] → Database enforces company & role filters
    ↓
[Component Render] → Conditionally show/hide restricted data
    ↓
Response (filtered for role)
```

## API Endpoints

### Authentication
- `POST /auth/signin` - Sign in with email/password
- `POST /auth/signup` - Register new account with role/company

### Plants
- `GET /api/plants` - List user's plants (company-scoped)
- `GET /api/plants/[id]/metrics` - Hourly metrics (all users)
- `GET /api/plants/[id]/monthly-costs` - Monthly costs (**ADMIN ONLY**, returns 403 for operators)

### Chat
- `POST /api/chat` - Send message to AI assistant
  - Filters responses based on user role
  - Provides context from user's plants
  - Blocks financial queries from operators

## Features

### 1. Landing Page
- Company branding ("Solar Operations Intelligence")
- Feature highlights (Real-time monitoring, AI analytics, Financial reports, Multi-plant)
- Call-to-action buttons for Sign In/Sign Up

### 2. Authentication
- Email/password sign-in and sign-up
- Role selection on signup (Operator/Admin)
- Company selection on signup
- JWT-based session management

### 3. Plant Dashboard
- **Date range filtering** (default: last 30 days)
- **Plant selector** dropdown
- **Four metric cards** with interactive charts:
  1. Total Energy (kWh) - with 7-day moving average
  2. Power Output (kW) - with 7-day moving average
  3. Average Irradiance (W/m²)
  4. Average Insolation (kWh/m²)
- **Temperature display** card
- Role-based field visibility (operators cannot see charts if restricted)
- Recharts line charts with actual vs. moving average

### 4. Plant Comparison
- Compare performance across all company plants
- Bar charts for total energy and average power
- Efficiency calculations (energy output vs. capacity)
- Summary table with detailed metrics

### 5. AI Chatbot (Solar Assistant)
- Real-time chat interface
- RBAC-aware responses
- Context from plant data
- Financial data filtering based on role
- Pattern-matching responses for common queries
- Message history display
- Automatic scrolling to latest message

### 6. Sidebar Navigation
- Logo and company branding
- Navigation links:
  - Overview (Dashboard)
  - Plants (Plant Dashboard)
  - Plant Comparison
  - AI Assistant
- User email display
- Sign out button

## Database Schema (Expected)

### plants
```
id (uuid)
name (string)
location (string)
capacity_kw (numeric)
commissioned_date (timestamp)
company_id (string) -- Foreign key to companies
created_at (timestamp)
```

### hourly_metrics
```
id (uuid)
plant_id (uuid)
timestamp (timestamp)
energy_produced_kwh (numeric)
power_output_kw (numeric)
insolation_kwh_m2 (numeric)
irradiance_w_m2 (numeric)
temperature_celsius (numeric)
created_at (timestamp)
```

### monthly_costs
```
id (uuid)
plant_id (uuid)
month (string) -- YYYY-MM format
cost_amount (numeric)
energy_price (numeric)
created_at (timestamp)
```

### users (Supabase Auth)
```
id (uuid)
email (string)
encrypted_password (string)
user_metadata:
  - company_id (string)
  - role ('admin' | 'operator')
created_at (timestamp)
```

## Environment Variables

Required `.env.development.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## RBAC Testing Checklist

### Admin User Tests
- [ ] Sign in as admin
- [ ] Access all plant metrics (energy, power, irradiance, insolation, temperature)
- [ ] View monthly costs via `/api/plants/[id]/monthly-costs`
- [ ] See financial data in AI chat responses
- [ ] View all dashboard sections

### Operator User Tests
- [ ] Sign in as operator
- [ ] Access operational metrics (energy, power, irradiance, insolation, temperature)
- [ ] See "Restricted for operators" placeholder for financial fields
- [ ] Get 403 error when accessing `/api/plants/[id]/monthly-costs`
- [ ] AI chat rejects financial data requests
- [ ] Cannot view financial reports

### Company Isolation Tests
- [ ] Create users in Company 1 and Company 2
- [ ] Verify Company 1 users only see Company 1 plants
- [ ] Verify Company 2 users only see Company 2 plants
- [ ] Verify RLS policies prevent cross-company access

### Data Visibility Tests
- [ ] Operators see only: energy, power, insolation, irradiance, temperature
- [ ] Admins see: all above + monthly costs + energy price
- [ ] Unauthenticated users redirected to `/auth/signin`
- [ ] Dashboard routes protected by middleware

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
```bash
# Copy .env.development.local with Supabase credentials
```

### 3. Set Up Supabase RLS Policies
```sql
-- Enable RLS on all tables
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE hourly_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_costs ENABLE ROW LEVEL SECURITY;

-- Plants: Users see only their company's plants
CREATE POLICY "Users can view their company plants" ON plants
FOR SELECT USING (company_id = auth.jwt() ->> 'company_id');

-- Monthly costs: Admins only
CREATE POLICY "Only admins can view monthly costs" ON monthly_costs
FOR SELECT USING (
  (monthly_costs.plant_id IN (SELECT id FROM plants WHERE company_id = auth.jwt() ->> 'company_id'))
  AND (auth.jwt() ->> 'role' = 'admin')
);

-- Hourly metrics: All authenticated users from their company
CREATE POLICY "Users can view company metrics" ON hourly_metrics
FOR SELECT USING (
  plant_id IN (SELECT id FROM plants WHERE company_id = auth.jwt() ->> 'company_id')
);
```

### 4. Start Development Server
```bash
npm run dev
# Runs on http://localhost:3000
```

### 5. Test the Application
- Navigate to http://localhost:3000
- Sign up with demo credentials
- Switch between admin and operator roles
- Verify RBAC restrictions

## Future Enhancements

- [ ] Eve AI agent with durable tool access
- [ ] Real-time Supabase subscriptions for live updates
- [ ] Advanced analytics and forecasting
- [ ] Custom report generation
- [ ] Alert system for anomalies
- [ ] Export data to CSV/PDF
- [ ] Mobile-responsive dashboards
- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Integration with external monitoring systems

## Troubleshooting

### Issue: "Missing company_id in user metadata"
- Ensure user metadata includes `company_id` during signup
- Check Supabase user settings

### Issue: "403 Forbidden" on financial endpoints
- Verify user role is set to 'admin'
- Check RLS policies are properly configured

### Issue: Cross-company data visible
- Verify `company_id` filter is applied to all queries
- Check RLS policies are active on tables

### Issue: Charts not rendering
- Verify hourly_metrics table has recent data
- Check date range in filters (should have data for selected range)
- Verify Recharts is installed: `npm list recharts`

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the RBAC implementation in `lib/auth.ts` and `lib/rbac.ts`
3. Verify Supabase RLS policies are correctly configured
4. Check browser console for errors
