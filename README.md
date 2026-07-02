# Solar Operations Intelligence Dashboard

A comprehensive multi-tenant solar energy management platform built with Next.js 16, Supabase, and Eve AI agents. Features real-time plant monitoring, role-based access control (RBAC), and an intelligent chatbot for data analysis.

## Features

✨ **Multi-Tenant Architecture**
- Company isolation with secure data access controls
- 2 configurable user roles with granular permissions

👥 **Role-Based Access Control (RBAC)**
- **Admin**: Full access to all metrics, financial data, and analytics
- **Operator**: Limited to operational metrics (energy, power, insolation, irradiance, temperature) with financial data blocked

📊 **Plant Dashboard**
- Real-time energy production and power output metrics
- Irradiance and insolation monitoring
- Temperature tracking
- Interactive time-series charts with moving averages
- Date range filtering
- Multi-plant comparison view

🤖 **AI-Powered Chatbot**
- Eve agent framework with OpenAI integration
- Natural language queries about plant data
- Role-aware responses (respects RBAC)
- Historical conversation management

🔐 **Enterprise Security**
- Supabase authentication with JWT tokens
- Row-Level Security (RLS) policies
- Server-side role validation on all API endpoints
- Company-scoped data access

## Quick Start

### Prerequisites
- Node.js 18+ 
- Supabase project (connected)
- OpenAI API key (for chatbot)

### Installation

```bash
# Clone and install dependencies
git clone <repo>
cd energy-ai-dashboard
npm install

# Set up environment variables
# Copy .env.development.local and update with your values:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_KEY
# - OPENAI_API_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```

### Database Setup

Ensure your Supabase database has these tables:

```sql
-- Plants table
CREATE TABLE plants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  capacity_kw DECIMAL,
  commissioned_date DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- Hourly metrics table
CREATE TABLE hourly_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id),
  timestamp TIMESTAMP NOT NULL,
  energy_produced_kwh DECIMAL,
  power_output_kw DECIMAL,
  insolation_kwh_m2 DECIMAL,
  irradiance_w_m2 DECIMAL,
  temperature_celsius DECIMAL,
  created_at TIMESTAMP DEFAULT now()
);

-- Monthly costs table (admin only)
CREATE TABLE monthly_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id),
  month DATE NOT NULL,
  cost_amount DECIMAL,
  energy_price DECIMAL,
  created_at TIMESTAMP DEFAULT now()
);
```

### Testing the RBAC System

1. **Create test users**:
   - Admin user: Select "Admin" role during signup
   - Operator user: Select "Operator (Limited Access)" role

2. **Verify access**:
   - Admin can see all data including monthly costs and energy prices
   - Operator cannot access financial endpoints (returns 403)
   - Both users only see their company's plants

## Architecture

### Tech Stack
- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS
- **Backend**: Supabase PostgreSQL, Eve AI agents
- **Charts**: Recharts
- **Auth**: Supabase Auth (JWT)
- **AI**: OpenAI via Vercel AI Gateway

### Project Structure

```
app/
├── page.tsx                 # Landing page
├── auth/
│   ├── signin/page.tsx     # Sign-in page
│   └── signup/page.tsx     # Sign-up with RBAC role selection
├── dashboard/
│   ├── layout.tsx          # Dashboard layout with sidebar
│   ├── plants/page.tsx     # Plant dashboard with charts
│   ├── comparison/page.tsx # Multi-plant comparison
│   └── chat/page.tsx       # AI chatbot interface
└── api/
    ├── chat/route.ts       # Eve chatbot endpoint
    ├── plants/
    │   ├── route.ts        # List plants (company-scoped)
    │   └── [id]/
    │       ├── metrics/route.ts        # Get hourly metrics
    │       └── monthly-costs/route.ts  # Admin-only financial data

lib/
├── auth.ts                 # Auth utilities and user context
├── rbac.ts                 # Role-based access control
├── supabase.ts             # Supabase client initialization
└── utils.ts                # Helper functions
```

### RBAC Implementation

**User Context Flow:**
1. Extract JWT from Supabase session
2. Decode user metadata (company_id, role)
3. Validate company access on all requests
4. Check role permissions before returning data
5. RLS policies enforce at database level

**API Protection:**
```typescript
// Example: Monthly costs endpoint (admin only)
if (!validateRole(userContext, 'admin')) {
  return NextResponse.json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  );
}
```

## Deployment

### Deploy to Vercel

```bash
# Connect Git repository
vercel link

# Set environment variables in Vercel dashboard
# Deploy
vercel deploy --prod
```

## Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Detailed setup and first steps
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Technical architecture and RBAC details
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Feature overview and roadmap

## Support

For issues or questions, please refer to the implementation documentation or contact the development team. 
