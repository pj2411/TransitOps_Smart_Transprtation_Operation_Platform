import xlsx from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = 'https://hybfaqnzfqgberumjxrk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5YmZhcW56ZnFnYmVydW1qeHJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4MDE0NjcsImV4cCI6MjA5OTM3NzQ2N30.v9KdhSQOF8TN-QLzdfyO-T2qlopDrUePhE64gVRJ2W8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// To avoid duplicate seeding issues, we'll clear the tables first
async function clearTables() {
  console.log('Clearing old data (if permissions allow)...');
  const tables = ['expenses', 'fuel_logs', 'maintenance_logs', 'trips', 'drivers', 'vehicles', 'users'];
  for (const t of tables) {
    await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }
}

async function seed() {
  const wbPath = join(__dirname, '..', '..', 'backend', 'TransitOps_Dummy_Data.xlsx');
  console.log('Loading Excel file from:', wbPath);
  const wb = xlsx.readFile(wbPath);

  await clearTables();

  // Maps for Foreign Keys
  const vehicleIdMap = new Map<string | number, string>();
  const driverIdMap = new Map<string | number, string>();
  const tripIdMap = new Map<string | number, string>();

  // 1. Users
  console.log('--- Seeding Users ---');
  const mockUsers = [
    { id: crypto.randomUUID(), email: 'admin@transitops.com', password: 'password123', role: 'Fleet Manager', failed_attempts: 0, locked_until: null },
    { id: crypto.randomUUID(), email: 'dispatcher@transitops.com', password: 'password123', role: 'Dispatcher', failed_attempts: 0, locked_until: null },
    { id: crypto.randomUUID(), email: 'safety@transitops.com', password: 'password123', role: 'Safety Officer', failed_attempts: 0, locked_until: null },
    { id: crypto.randomUUID(), email: 'finance@transitops.com', password: 'password123', role: 'Financial Analyst', failed_attempts: 0, locked_until: null },
  ];
  
  for (const u of mockUsers) {
    const { error } = await supabase.from('users').upsert(u, { onConflict: 'email' });
    if (error) console.error("Error inserting user", u.email, error.message);
  }

  // 2. Vehicles
  console.log('--- Seeding Vehicles ---');
  const vehiclesData: any[] = xlsx.utils.sheet_to_json(wb.Sheets['Vehicles']);
  for (const v of vehiclesData) {
    const newId = crypto.randomUUID();
    vehicleIdMap.set(v.id, newId);

    const row = {
      id: newId,
      reg_number: v.registration,
      name_model: v.name,
      type: v.type,
      max_load_capacity: v.capacityKg,
      odometer: v.odometer,
      acquisition_cost: v.acquisitionCost,
      status: v.status
    };
    const { error } = await supabase.from('vehicles').insert(row);
    if (error) console.error("Error inserting vehicle", v.registration, error.message);
  }

  // 3. Drivers
  console.log('--- Seeding Drivers ---');
  const driversData: any[] = xlsx.utils.sheet_to_json(wb.Sheets['Drivers']);
  for (const d of driversData) {
    const newId = crypto.randomUUID();
    driverIdMap.set(d.id, newId);

    const row = {
      id: newId,
      name: d.name,
      license_number: d.license,
      license_category: d.category,
      license_expiry_date: typeof d.licenseExpiry === 'number' ? new Date((d.licenseExpiry - 25569) * 86400 * 1000).toISOString().split('T')[0] : d.licenseExpiry,
      contact_number: d.contact,
      safety_score: d.safetyScore,
      total_trips: 0,
      completed_trips: 0,
      status: d.status
    };
    const { error } = await supabase.from('drivers').insert(row);
    if (error) console.error("Error inserting driver", d.name, error.message);
  }

  // 4. Trips
  console.log('--- Seeding Trips ---');
  const tripsData: any[] = xlsx.utils.sheet_to_json(wb.Sheets['Trips']);
  for (const t of tripsData) {
    const newId = crypto.randomUUID();
    tripIdMap.set(t.id, newId);

    const row = {
      id: newId,
      source: t.source,
      destination: t.destination,
      vehicle_id: vehicleIdMap.get(t.vehicleId) || null,
      driver_id: driverIdMap.get(t.driverId) || null,
      cargo_weight: t.cargoWeight,
      planned_distance: t.plannedDistance,
      revenue: t.revenue,
      final_odometer: t.finalOdometer || null,
      fuel_used: t.fuelUsed || null,
      status: t.status
    };
    const { error } = await supabase.from('trips').insert(row);
    if (error) console.error("Error inserting trip", t.source, error.message);
  }

  // 5. Maintenance
  console.log('--- Seeding Maintenance ---');
  const maintenanceData: any[] = xlsx.utils.sheet_to_json(wb.Sheets['Maintenance']);
  for (const m of maintenanceData) {
    const row = {
      id: crypto.randomUUID(),
      vehicle_id: vehicleIdMap.get(m.vehicleId) || null,
      service_type: m.serviceType,
      cost: m.cost,
      date_opened: typeof m.dateOpened === 'number' ? new Date((m.dateOpened - 25569) * 86400 * 1000).toISOString().split('T')[0] : m.dateOpened,
      date_closed: m.dateClosed ? (typeof m.dateClosed === 'number' ? new Date((m.dateClosed - 25569) * 86400 * 1000).toISOString().split('T')[0] : m.dateClosed) : null,
      status: m.status
    };
    const { error } = await supabase.from('maintenance_logs').insert(row);
    if (error) console.error("Error inserting maintenance", m.serviceType, error.message);
  }

  // 6. FuelLogs
  console.log('--- Seeding FuelLogs ---');
  const fuelData: any[] = xlsx.utils.sheet_to_json(wb.Sheets['FuelLogs']);
  for (const f of fuelData) {
    const row = {
      id: crypto.randomUUID(),
      vehicle_id: vehicleIdMap.get(f.vehicleId) || null,
      liters: f.liters,
      cost: f.cost,
      date: typeof f.date === 'number' ? new Date((f.date - 25569) * 86400 * 1000).toISOString().split('T')[0] : f.date
    };
    const { error } = await supabase.from('fuel_logs').insert(row);
    if (error) console.error("Error inserting fuel log", f.liters, error.message);
  }

  // 7. Expenses
  console.log('--- Seeding Expenses ---');
  const expensesData: any[] = xlsx.utils.sheet_to_json(wb.Sheets['Expenses']);
  for (const e of expensesData) {
    const row = {
      id: crypto.randomUUID(),
      trip_id: tripIdMap.get(e.tripId) || null,
      vehicle_id: vehicleIdMap.get(e.vehicleId) || null,
      toll: e.toll,
      other: e.other,
      date: typeof e.date === 'number' ? new Date((e.date - 25569) * 86400 * 1000).toISOString().split('T')[0] : e.date
    };
    const { error } = await supabase.from('expenses').insert(row);
    if (error) console.error("Error inserting expense", e.toll, error.message);
  }

  console.log('Seeding completed!');
  process.exit(0);
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
});
