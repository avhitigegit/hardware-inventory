  ---
  Services & Technologies

  Version Control
  - Git — source code versioning
  - GitHub — remote repository hosting

  Hosting

  - Vercel — app deployment and hosting (no Docker, no servers to manage)

  Database & Auth

  - Supabase — managed PostgreSQL database + authentication
    - Auth: email/password login, session management
    - Database: PostgreSQL with Row Level Security (RLS)
    - Storage: avatar image uploads (avatars bucket)

  Email

  - Gmail + Nodemailer — sends welcome emails to new users via Gmail App Password

  ---
  Frontend

  ┌─────────────────────────┬──────────────────────────────┐
  │       Technology        │           Purpose            │
  ├─────────────────────────┼──────────────────────────────┤
  │ Next.js 16 (App Router) │ Full-stack React framework   │
  ├─────────────────────────┼──────────────────────────────┤
  │ React 19                │ UI rendering                 │
  ├─────────────────────────┼──────────────────────────────┤
  │ TypeScript              │ Type safety                  │
  ├─────────────────────────┼──────────────────────────────┤
  │ Tailwind CSS 4          │ Styling                      │
  ├─────────────────────────┼──────────────────────────────┤
  │ shadcn/ui + Radix UI    │ UI component library         │
  ├─────────────────────────┼──────────────────────────────┤
  │ Lucide React            │ Icons                        │
  ├─────────────────────────┼──────────────────────────────┤
  │ Recharts                │ Dashboard charts and graphs  │
  ├─────────────────────────┼──────────────────────────────┤
  │ React Hook Form + Zod   │ Form handling and validation │
  ├─────────────────────────┼──────────────────────────────┤
  │ Sonner                  │ Toast notifications          │
  ├─────────────────────────┼──────────────────────────────┤
  │ next-themes             │ Light/dark theme support     │
  └─────────────────────────┴──────────────────────────────┘

  Backend

  ┌────────────────────────┬────────────────────────────────────────────┐
  │       Technology       │                  Purpose                   │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ Next.js Server Actions │ All backend logic (no separate API server) │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ Supabase JS SDK        │ Database queries and auth                  │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ Nodemailer             │ Email sending                              │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ @react-pdf/renderer    │ PDF generation (barcode labels, reports)   │
  └────────────────────────┴────────────────────────────────────────────┘

  State Management

  ┌──────────────────────┬───────────────────────────────────────────┐
  │      Technology      │                  Purpose                  │
  ├──────────────────────┼───────────────────────────────────────────┤
  │ TanStack React Query │ Server state, caching, background refetch │
  └──────────────────────┴───────────────────────────────────────────┘

  ---
  What you do NOT have

  - No Docker
  - No separate backend/API server
  - No Redis or caching layer
  - No message queues
  - No CI/CD pipelines (manual deploy via Vercel git integration)
  - No monitoring/logging service

  ---
  Everything runs on 3 external services: GitHub + Supabase + Vercel. All free tier.



  ● Here are the free tier limits for all three services:

  ---  GitHub Free
  ┌────────────────────────┬───────────────────────────────────────┐                       │                Amount  │   Limit
  ├────────────────────────┼───────────────────────────────────────┤
  │ Repositories           │ Unlimited (public & private)          │
  ├────────────────────────┼───────────────────────────────────────┤
  │ Collaborators          │ Unlimited                             │
  ├────────────────────────┼───────────────────────────────────────┤
  │ Private repo storage   │ 1 GB recommended (hard limit ~100 GB) │
  ├────────────────────────┼───────────────────────────────────────┤
  │ GitHub Actions (CI/CD) │ 2,000 minutes/month                   │
  ├────────────────────────┼───────────────────────────────────────┤
  │ File size per upload   │ Max 100 MB per file                   │
  └────────────────────────┴───────────────────────────────────────┘

  Practical concern: Almost no limits for a codebase like this. You'll never hit them.

  ---
  Supabase Free

  ┌────────────────────────┬────────────────────────────────────────────┐
  │         Limit          │                   Amount                   │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ Database storage       │ 500 MB                                     │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ File storage (avatars) │ 1 GB                                       │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ Bandwidth              │ 5 GB/month                                 │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ Auth users (MAU)       │ 50,000 monthly active users                │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ Active projects        │ 2 max                                      │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ API requests           │ Unlimited                                  │
  ├────────────────────────┼────────────────────────────────────────────┤
  │ ⚠ Auto-pause           │ Project pauses after 1 week of no activity │
  └────────────────────────┴────────────────────────────────────────────┘

  Important warnings:
  - Database is 500 MB, not 1 GB (you mentioned 1 GB — that's the file storage)
  - Auto-pause is the biggest risk — if nobody logs in for 7 days, the database pauses. First request after that takes 20–30
  seconds to wake up. Data is NOT lost
  - To avoid pause: someone must log in at least once a week, or upgrade to Pro ($25/month)

  ---
  Vercel Free (Hobby Plan)

  ┌─────────────────────────────┬────────────────────────┐
  │            Limit            │         Amount         │
  ├─────────────────────────────┼────────────────────────┤
  │ Bandwidth                   │ 100 GB/month           │
  ├─────────────────────────────┼────────────────────────┤
  │ Build minutes               │ 6,000 minutes/month    │
  ├─────────────────────────────┼────────────────────────┤
  │ Deployments                 │ 100/day                │
  ├─────────────────────────────┼────────────────────────┤
  │ Serverless function timeout │ 10 seconds max         │
  ├─────────────────────────────┼────────────────────────┤
  │ Concurrent builds           │ 1                      │
  ├─────────────────────────────┼────────────────────────┤
  │ Custom domains              │ Yes                    │
  ├─────────────────────────────┼────────────────────────┤
  │ Team members                │ 1 (only you)           │
  ├─────────────────────────────┼────────────────────────┤
  │ SLA / uptime guarantee      │ None                   │
  ├─────────────────────────────┼────────────────────────┤
  │ Commercial use              │ Not officially allowed │
  └─────────────────────────────┴────────────────────────┘

  Important warnings:
  - 10 second timeout — if any server action (email sending, heavy report) takes longer than 10 seconds, it will fail. Currently  your email sending via Gmail could be at risk on slow connections
  - No commercial use on Hobby plan — technically this is a business app. Vercel Pro is $20/month and removes this restriction
  - No team members — only one Vercel account can manage the deployment

  ---
  Summary for your hardware shop

  ┌──────────┬────────────┬────────────────────────────────────────────────────────────────┐
  │ Service  │ Risk Level │                         Recommendation                         │
  ├──────────┼────────────┼────────────────────────────────────────────────────────────────┤
  │ GitHub   │ None       │ Free is fine forever                                           │
  ├──────────┼────────────┼────────────────────────────────────────────────────────────────┤
  │ Supabase │ Medium     │ Auto-pause is annoying. Upgrade to Pro if daily use            │
  ├──────────┼────────────┼────────────────────────────────────────────────────────────────┤
  │ Vercel   │ Medium     │ 10s timeout + no commercial use. Upgrade to Pro for production │
  └──────────┴────────────┴────────────────────────────────────────────────────────────────┘

  Estimated cost to remove all limitations:
  - Supabase Pro: $25/month
  - Vercel Pro: $20/month
  - Total: ~$45/month for a fully production-ready setup