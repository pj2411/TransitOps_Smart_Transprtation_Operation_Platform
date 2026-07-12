# TransitOps

TransitOps is a comprehensive fleet and transportation management platform designed to streamline operations, tracking, and analytics for modern transit companies.

## Overview
This platform provides a centralized dashboard for managing everything from vehicle maintenance and driver safety scores to live trip dispatching and financial reporting. It features a strict Role-Based Access Control (RBAC) system to ensure different departments—like Fleet Managers, Dispatchers, and Safety Officers—only see the data relevant to their specific workflows.

## Technology Stack
- **Frontend**: React, TypeScript, Vite
- **Routing**: TanStack Router
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS v4, custom CSS variables, Shadcn/Radix UI components
- **Database / Backend**: Supabase (PostgreSQL)

## Features
- **Secure Authentication & Roles**: Email/password login with strict route protection. User roles control what modules are accessible in the sidebar.
- **Fleet Registry**: Complete vehicle tracking, including odometer readings, acquisition costs, and real-time status (Available, On Trip, In Shop).
- **Driver Management**: Track licenses, expiry dates, and driver safety scores to ensure compliance.
- **Trip Dispatch**: Assign vehicles and drivers to new routes, checking against maximum load capacities, and manage the trip lifecycle.
- **Maintenance & Fuel Logs**: Record service costs and fuel expenses per vehicle to maintain a healthy fleet.
- **Financial Analytics**: High-level charts (via Recharts) displaying vehicle ROI, fuel efficiency trends, and overall cost breakdowns.

## Local Development

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Access the application**
   Open your browser to `http://localhost:5173`. 

*Note: The platform connects to a hosted Supabase database instance. Ensure your network allows connections to Supabase.*
