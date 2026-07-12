-- TransitOps Supabase Schema Definition
-- Run this script in the Supabase SQL Editor to initialize the database

-- 1. Custom Types
CREATE TYPE user_role AS ENUM ('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst');
CREATE TYPE vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired');
CREATE TYPE driver_status AS ENUM ('Available', 'On Trip', 'Off Duty', 'Suspended');
CREATE TYPE trip_status AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');
CREATE TYPE maintenance_status AS ENUM ('Open', 'Closed');
CREATE TYPE access_level AS ENUM ('full', 'view', 'none');
CREATE TYPE app_module AS ENUM ('Fleet', 'Drivers', 'Trips', 'Fuel-Exp', 'Analytics', 'Settings');

-- 2. Tables
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role user_role NOT NULL,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reg_number TEXT UNIQUE NOT NULL,
    name_model TEXT NOT NULL,
    type TEXT NOT NULL,
    max_load_capacity NUMERIC NOT NULL,
    odometer NUMERIC NOT NULL DEFAULT 0,
    acquisition_cost NUMERIC NOT NULL,
    status vehicle_status NOT NULL DEFAULT 'Available'
);

CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    license_number TEXT UNIQUE NOT NULL,
    license_category TEXT NOT NULL,
    license_expiry_date DATE NOT NULL,
    contact_number TEXT NOT NULL,
    safety_score NUMERIC NOT NULL DEFAULT 100,
    total_trips INT DEFAULT 0,
    completed_trips INT DEFAULT 0,
    status driver_status NOT NULL DEFAULT 'Available'
);

CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,
    destination TEXT NOT NULL,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
    cargo_weight NUMERIC NOT NULL,
    planned_distance NUMERIC NOT NULL,
    revenue NUMERIC NOT NULL DEFAULT 0,
    final_odometer NUMERIC,
    fuel_used NUMERIC,
    remarks TEXT,
    status trip_status NOT NULL DEFAULT 'Draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.maintenance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL,
    cost NUMERIC NOT NULL,
    date_opened DATE NOT NULL,
    date_closed DATE,
    status maintenance_status NOT NULL DEFAULT 'Open'
);

CREATE TABLE public.fuel_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    liters NUMERIC NOT NULL,
    cost NUMERIC NOT NULL,
    date DATE NOT NULL
);

CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
    toll NUMERIC DEFAULT 0,
    other NUMERIC DEFAULT 0,
    date DATE NOT NULL
);

CREATE TABLE public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    depot_name TEXT NOT NULL DEFAULT 'TransitOps Main Depot',
    currency TEXT NOT NULL DEFAULT '₹',
    distance_unit TEXT NOT NULL DEFAULT 'km'
);

CREATE TABLE public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    module app_module NOT NULL,
    access access_level NOT NULL DEFAULT 'none',
    UNIQUE(role, module)
);

-- 3. Row Level Security (RLS) Policies
-- For this prototype, we'll enable RLS but allow anon access for simplicity.
-- In a real app, policies would check auth.uid() and user roles.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read/write access for all tables" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access for all tables" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access for all tables" ON public.drivers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access for all tables" ON public.trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access for all tables" ON public.maintenance_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access for all tables" ON public.fuel_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access for all tables" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access for all tables" ON public.settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon read/write access for all tables" ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);


-- 4. Initial Seed Data
INSERT INTO public.settings (depot_name, currency, distance_unit) VALUES ('TransitOps Main Depot', '₹', 'km');

INSERT INTO public.users (email, password, role) VALUES 
('fleet@transitops.in', 'fleet123', 'Fleet Manager'),
('dispatch@transitops.in', 'dispatch123', 'Dispatcher'),
('safety@transitops.in', 'safety123', 'Safety Officer'),
('finance@transitops.in', 'finance123', 'Financial Analyst');

INSERT INTO public.role_permissions (role, module, access) VALUES
('Fleet Manager', 'Fleet', 'full'), ('Fleet Manager', 'Drivers', 'full'), ('Fleet Manager', 'Trips', 'none'), ('Fleet Manager', 'Fuel-Exp', 'none'), ('Fleet Manager', 'Analytics', 'none'), ('Fleet Manager', 'Settings', 'full'),
('Dispatcher', 'Fleet', 'none'), ('Dispatcher', 'Drivers', 'none'), ('Dispatcher', 'Trips', 'full'), ('Dispatcher', 'Fuel-Exp', 'none'), ('Dispatcher', 'Analytics', 'none'), ('Dispatcher', 'Settings', 'none'),
('Safety Officer', 'Fleet', 'none'), ('Safety Officer', 'Drivers', 'full'), ('Safety Officer', 'Trips', 'view'), ('Safety Officer', 'Fuel-Exp', 'none'), ('Safety Officer', 'Analytics', 'none'), ('Safety Officer', 'Settings', 'none'),
('Financial Analyst', 'Fleet', 'none'), ('Financial Analyst', 'Drivers', 'none'), ('Financial Analyst', 'Trips', 'none'), ('Financial Analyst', 'Fuel-Exp', 'full'), ('Financial Analyst', 'Analytics', 'full'), ('Financial Analyst', 'Settings', 'none');
