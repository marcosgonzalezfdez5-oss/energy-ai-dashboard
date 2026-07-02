# Documentation Index

Welcome to the Solar Operations Intelligence Dashboard documentation. This guide will help you navigate all available resources.

## Quick Navigation

### 🚀 Getting Started
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - First time setup, environment configuration, and initial testing
- **[README.md](./README.md)** - Project overview, features, and quick start guide

### 📋 Implementation Details
- **[IMPLEMENTATION.md](./IMPLEMENTATION.md)** - Technical architecture, RBAC system, database schema, and implementation layers
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Feature overview, tech stack details, and roadmap

### ✅ Testing & Quality Assurance
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - Comprehensive testing checklist covering authentication, RBAC, UI, API, performance, security, and deployment verification

### 🚢 Deployment & Operations
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Step-by-step deployment guide, environment setup, monitoring, scaling, troubleshooting, and rollback procedures

## Document Guide by Role

### 👨‍💼 Project Managers
1. Read: [README.md](./README.md) - Understand features
2. Read: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - See roadmap
3. Check: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Verify quality

### 👨‍💻 Developers (First Time)
1. Read: [GETTING_STARTED.md](./GETTING_STARTED.md) - Set up environment
2. Read: [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Understand architecture
3. Reference: [README.md](./README.md) - API and component reference

### 🏗️ DevOps / Infrastructure
1. Read: [DEPLOYMENT.md](./DEPLOYMENT.md) - Deploy to production
2. Reference: [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Database setup
3. Check: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Post-deployment verification

### 🧪 QA Engineers
1. Read: [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) - Complete testing guide
2. Reference: [IMPLEMENTATION.md](./IMPLEMENTATION.md) - Understand RBAC requirements
3. Check: [README.md](./README.md) - Feature list

## Core Features by Documentation

### Authentication & Security
- **File**: [IMPLEMENTATION.md](./IMPLEMENTATION.md#rbac-implementation)
- **Topics**: User signup/signin, JWT tokens, session management, password security

### Role-Based Access Control (RBAC)
- **File**: [IMPLEMENTATION.md](./IMPLEMENTATION.md#role-based-access-control-rbac-model)
- **Topics**: 
  - Company isolation (multi-tenancy)
  - User roles (Admin vs Operator)
  - Permission levels
  - Implementation layers

### Plant Dashboard
- **File**: [README.md](./README.md#features)
- **Topics**: Real-time metrics, charts, date filtering, plant selection

### Plant Comparison
- **File**: [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)
- **Topics**: Multi-plant analytics, comparative metrics

### AI Chatbot
- **File**: [IMPLEMENTATION.md](./IMPLEMENTATION.md#eve-ai-chatbot-integration)
- **Topics**: Eve framework, OpenAI integration, role-aware responses

### API Endpoints
- **File**: [README.md](./README.md#architecture)
- **Topics**: Plants, metrics, monthly costs, chat endpoint specifications

## Technology Stack

**Frontend**: Next.js 16, React 19, Tailwind CSS, Recharts
**Backend**: Supabase PostgreSQL, Eve AI agents, Vercel Functions
**Auth**: Supabase Auth (JWT)
**AI**: OpenAI via Vercel AI Gateway
**Deployment**: Vercel

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for detailed tech stack information.

## Key Concepts

### Multi-Tenancy
Companies are isolated by `company_id`. Users can only access data from their company.
**Reference**: [IMPLEMENTATION.md](./IMPLEMENTATION.md#company-isolation)

### Row-Level Security (RLS)
Database policies automatically enforce company and role-based access.
**Reference**: [GETTING_STARTED.md](./GETTING_STARTED.md#setting-up-row-level-security-rls)

### User Roles
- **Admin**: Full access to all operational and financial data
- **Operator**: Operational metrics only (no financial data)
**Reference**: [IMPLEMENTATION.md](./IMPLEMENTATION.md#user-roles--permissions)

### API Protection
All API endpoints validate user context and enforce role-based permissions.
**Reference**: [IMPLEMENTATION.md](./IMPLEMENTATION.md#api-protection)

## Troubleshooting

### Common Issues
See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for common deployment issues.

### Development Issues
See [GETTING_STARTED.md](./GETTING_STARTED.md#common-issues-and-solutions) for development setup issues.

### Testing Issues
See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for test verification steps.

## Deployment Checklist

Before going to production:
1. ✅ Complete [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
2. ✅ Follow [DEPLOYMENT.md](./DEPLOYMENT.md)
3. ✅ Verify all environment variables
4. ✅ Confirm RLS policies are enabled
5. ✅ Test authentication flows
6. ✅ Verify RBAC enforcement
7. ✅ Monitor production for 24 hours

## File Organization

```
energy-ai-dashboard/
├── README.md                    # Main overview & quick start
├── GETTING_STARTED.md           # Setup & first steps
├── IMPLEMENTATION.md            # Technical architecture
├── PROJECT_SUMMARY.md           # Features & roadmap
├── DEPLOYMENT.md                # Production deployment
├── TESTING_CHECKLIST.md         # QA verification
├── DOCS_INDEX.md               # This file
│
├── app/                         # Next.js App Router
│   ├── page.tsx                # Landing page
│   ├── auth/                   # Authentication pages
│   ├── dashboard/              # Protected dashboard
│   └── api/                    # API endpoints
│
├── components/                  # React components
│   ├── PlantSelector.tsx       # Plant selection
│   ├── PlantDashboard.tsx      # Dashboard layout
│   └── MetricCard.tsx          # Chart cards
│
└── lib/                         # Utilities
    ├── auth.ts                 # Auth utilities
    ├── rbac.ts                 # RBAC utilities
    └── supabase.ts             # Supabase client
```

## Getting Help

### Documentation Search
Use your browser's search (Ctrl+F / Cmd+F) to find keywords:
- Search "RBAC" to find role-based content
- Search "API" to find endpoint documentation
- Search "ENV" to find environment variable setup

### Asking Questions
When asking for help, provide:
1. What you're trying to do
2. Which document you've read
3. The error message (if applicable)
4. Steps to reproduce

### Reporting Issues
1. Check [TROUBLESHOOTING](./DEPLOYMENT.md#troubleshooting) first
2. Search documentation for similar issues
3. Create detailed issue report with:
   - Error message
   - Steps to reproduce
   - Environment (dev/staging/prod)
   - Browser/device info

## Updates & Maintenance

- **Last Updated**: 2026-07-02
- **Version**: 1.0.0
- **Next Review**: Monthly

When updating documentation:
1. Update the specific topic file
2. Update this index if adding new sections
3. Update [README.md](./README.md) if features change
4. Commit with clear message

## Quick Reference Links

| Topic | File | Section |
|-------|------|---------|
| Environment Variables | [GETTING_STARTED.md](./GETTING_STARTED.md) | Setup |
| Database Schema | [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Database |
| API Endpoints | [README.md](./README.md) | API Architecture |
| RBAC Roles | [IMPLEMENTATION.md](./IMPLEMENTATION.md) | RBAC Model |
| Deployment Steps | [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment |
| Testing | [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) | All Tests |
| Troubleshooting | [DEPLOYMENT.md](./DEPLOYMENT.md) | Troubleshooting |
| Monitoring | [DEPLOYMENT.md](./DEPLOYMENT.md) | Monitoring |

---

**Questions?** Start with the appropriate document above based on your role or the topic you're looking for.

**First time here?** Begin with [GETTING_STARTED.md](./GETTING_STARTED.md).
