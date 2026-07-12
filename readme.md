# TransitOps - Smart Transportation Operation Platform

A modern, smart transit operation platform for real-time tracking, fleet management, and scheduling.

## Architecture & Tech Stack
This prototype is built using a modern frontend-first approach connected to a live BaaS:
- **Frontend**: React + TypeScript + Vite
- **Styling**: Vanilla CSS Variables (Bespoke Dark Mode ERP Theme)
- **Icons & Charts**: Lucide React, Recharts
- **Backend/Database**: Supabase (PostgreSQL) with Row Level Security (RLS) and real-time triggers.

## Key Features
- **RBAC**: Role-based access control with distinct permission matrices (Fleet Manager, Dispatcher, Safety Officer, Financial Analyst).
- **Fleet & Driver Registry**: Full CRUD with conditional validations and live status tracking.
- **Trip Dispatching**: Real-time vehicle load capacity checking and deployment state machine.
- **Maintenance & Fuel**: Operational cost tracking that rolls up into financial reporting.
- **Analytics**: Beautiful Recharts dashboards for calculating Vehicle ROI, Fuel Efficiency, and Fleet Utilization.
