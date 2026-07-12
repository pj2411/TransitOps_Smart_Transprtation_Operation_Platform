/* ──────────────────── TransitOps Data Store (Supabase) ──────────────────── */
import { supabase } from './supabase';
import type {
  User, Vehicle, Driver, Trip, MaintenanceLog,
  FuelLog, Expense, Settings, RolePermission,
  UserRole, VehicleStatus, DriverStatus, TripStatus
} from '../types';

/* ── MAPPERS (snake_case DB -> camelCase UI) ── */
const mapVehicle = (row: any): Vehicle => ({
  id: row.id, regNumber: row.reg_number, nameModel: row.name_model, type: row.type,
  maxLoadCapacity: Number(row.max_load_capacity), odometer: Number(row.odometer),
  acquisitionCost: Number(row.acquisition_cost), status: row.status
});

const mapDriver = (row: any): Driver => ({
  id: row.id, name: row.name, licenseNumber: row.license_number, licenseCategory: row.license_category,
  licenseExpiryDate: row.license_expiry_date, contactNumber: row.contact_number,
  safetyScore: Number(row.safety_score), totalTrips: Number(row.total_trips),
  completedTrips: Number(row.completed_trips), status: row.status
});

const mapTrip = (row: any): Trip => ({
  id: row.id, source: row.source, destination: row.destination, vehicleId: row.vehicle_id,
  driverId: row.driver_id, cargoWeight: Number(row.cargo_weight), plannedDistance: Number(row.planned_distance),
  revenue: Number(row.revenue), finalOdometer: row.final_odometer ? Number(row.final_odometer) : null,
  fuelUsed: row.fuel_used ? Number(row.fuel_used) : null, remarks: row.remarks || '',
  status: row.status, createdAt: row.created_at
});

const mapMaintenance = (row: any): MaintenanceLog => ({
  id: row.id, vehicleId: row.vehicle_id, serviceType: row.service_type,
  cost: Number(row.cost), dateOpened: row.date_opened, dateClosed: row.date_closed, status: row.status
});

const mapFuel = (row: any): FuelLog => ({
  id: row.id, vehicleId: row.vehicle_id, liters: Number(row.liters), cost: Number(row.cost), date: row.date
});

const mapExpense = (row: any): Expense => ({
  id: row.id, tripId: row.trip_id, vehicleId: row.vehicle_id, toll: Number(row.toll),
  other: Number(row.other), date: row.date
});

/* ── SEED CHECK (Supabase is already seeded by schema.sql) ── */
export function seedIfEmpty() {
  // DB is already seeded via SQL
}

/* ══════════════════════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════════════════════ */
export async function login(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
  if (error || !data) throw new Error('Invalid credentials');

  const user = data as any;
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const mins = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
    throw new Error(`Account locked. Try again in ${mins} minute(s).`);
  }

  if (user.password !== password) {
    let fails = user.failed_attempts + 1;
    let locked = null;
    if (fails >= 5) {
      locked = new Date(Date.now() + 15 * 60000).toISOString();
      fails = 0;
    }
    await supabase.from('users').update({ failed_attempts: fails, locked_until: locked }).eq('id', user.id);
    throw new Error('Invalid credentials');
  }

  await supabase.from('users').update({ failed_attempts: 0, locked_until: null }).eq('id', user.id);
  
  cachedPerms = await getRolePermissions();

  return {
    id: user.id, email: user.email, password: user.password, role: user.role,
    failedAttempts: 0, lockedUntil: null
  };
}

/* ══════════════════════════════════════════════════════════════
   VEHICLES
   ══════════════════════════════════════════════════════════════ */
export async function getVehicles(): Promise<Vehicle[]> {
  const { data } = await supabase.from('vehicles').select('*').order('reg_number');
  return (data || []).map(mapVehicle);
}

export async function addVehicle(v: Omit<Vehicle, 'id'>): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').insert({
    reg_number: v.regNumber, name_model: v.nameModel, type: v.type,
    max_load_capacity: v.maxLoadCapacity, odometer: v.odometer,
    acquisition_cost: v.acquisitionCost, status: v.status
  }).select().single();
  if (error) throw new Error(error.message.includes('unique') ? 'Registration number already exists' : error.message);
  return mapVehicle(data);
}

export async function updateVehicle(v: Vehicle): Promise<Vehicle> {
  const { data, error } = await supabase.from('vehicles').update({
    reg_number: v.regNumber, name_model: v.nameModel, type: v.type,
    max_load_capacity: v.maxLoadCapacity, odometer: v.odometer,
    acquisition_cost: v.acquisitionCost, status: v.status
  }).eq('id', v.id).select().single();
  if (error) throw new Error(error.message.includes('unique') ? 'Registration number already exists' : error.message);
  return mapVehicle(data);
}

export async function deleteVehicle(id: string): Promise<void> {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ══════════════════════════════════════════════════════════════
   DRIVERS
   ══════════════════════════════════════════════════════════════ */
export async function getDrivers(): Promise<Driver[]> {
  const { data } = await supabase.from('drivers').select('*').order('name');
  return (data || []).map(mapDriver);
}

export async function addDriver(d: Omit<Driver, 'id'>): Promise<Driver> {
  const { data, error } = await supabase.from('drivers').insert({
    name: d.name, license_number: d.licenseNumber, license_category: d.licenseCategory,
    license_expiry_date: d.licenseExpiryDate, contact_number: d.contactNumber,
    safety_score: d.safetyScore, total_trips: d.totalTrips, completed_trips: d.completedTrips,
    status: d.status
  }).select().single();
  if (error) throw new Error(error.message.includes('unique') ? 'License number already exists' : error.message);
  return mapDriver(data);
}

export async function updateDriver(d: Driver): Promise<Driver> {
  const { data, error } = await supabase.from('drivers').update({
    name: d.name, license_number: d.licenseNumber, license_category: d.licenseCategory,
    license_expiry_date: d.licenseExpiryDate, contact_number: d.contactNumber,
    safety_score: d.safetyScore, total_trips: d.totalTrips, completed_trips: d.completedTrips,
    status: d.status
  }).eq('id', d.id).select().single();
  if (error) throw new Error(error.message);
  return mapDriver(data);
}

export async function deleteDriver(id: string): Promise<void> {
  const { error } = await supabase.from('drivers').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ══════════════════════════════════════════════════════════════
   DISPATCH POOL
   ══════════════════════════════════════════════════════════════ */
export async function getDispatchVehicles(): Promise<Vehicle[]> {
  const { data } = await supabase.from('vehicles').select('*').eq('status', 'Available');
  return (data || []).map(mapVehicle);
}

export async function getDispatchDrivers(): Promise<Driver[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('drivers').select('*').eq('status', 'Available').gte('license_expiry_date', today);
  return (data || []).map(mapDriver);
}

/* ══════════════════════════════════════════════════════════════
   TRIPS
   ══════════════════════════════════════════════════════════════ */
export async function getTrips(): Promise<Trip[]> {
  const { data } = await supabase.from('trips').select('*').order('created_at', { ascending: false });
  return (data || []).map(mapTrip);
}

export async function addTrip(t: Omit<Trip, 'id' | 'createdAt'>): Promise<Trip> {
  // Validate capacity first
  const { data: v } = await supabase.from('vehicles').select('max_load_capacity').eq('id', t.vehicleId).single();
  if (v && t.cargoWeight > v.max_load_capacity) {
    throw new Error(`Cargo weight exceeds vehicle capacity (${v.max_load_capacity}kg)`);
  }
  
  const { data, error } = await supabase.from('trips').insert({
    source: t.source, destination: t.destination, vehicle_id: t.vehicleId, driver_id: t.driverId,
    cargo_weight: t.cargoWeight, planned_distance: t.plannedDistance, revenue: t.revenue,
    remarks: t.remarks, status: 'Draft'
  }).select().single();
  if (error) throw new Error(error.message);
  return mapTrip(data);
}

export async function updateTrip(t: Trip): Promise<Trip> {
  const { data, error } = await supabase.from('trips').update({
    source: t.source, destination: t.destination, vehicle_id: t.vehicleId, driver_id: t.driverId,
    cargo_weight: t.cargoWeight, planned_distance: t.plannedDistance, revenue: t.revenue,
    remarks: t.remarks
  }).eq('id', t.id).select().single();
  if (error) throw new Error(error.message);
  return mapTrip(data);
}

export async function dispatchTrip(tripId: string): Promise<void> {
  const { data: trip, error } = await supabase.from('trips').select('status, vehicle_id, driver_id').eq('id', tripId).single();
  if (error || !trip) throw new Error('Trip not found');
  if (trip.status !== 'Draft') throw new Error('Only Draft trips can be dispatched');

  await supabase.from('trips').update({ status: 'Dispatched' }).eq('id', tripId);
  if (trip.vehicle_id) await supabase.from('vehicles').update({ status: 'On Trip' }).eq('id', trip.vehicle_id);
  if (trip.driver_id) await supabase.from('drivers').update({ status: 'On Trip' }).eq('id', trip.driver_id);
}

export async function completeTrip(tripId: string, finalOdometer: number, fuelUsed: number, toll?: number, otherExpense?: number): Promise<void> {
  const { data: trip } = await supabase.from('trips').select('*').eq('id', tripId).single();
  if (!trip || trip.status !== 'Dispatched') throw new Error('Cannot complete this trip');

  await supabase.from('trips').update({ status: 'Completed', final_odometer: finalOdometer, fuel_used: fuelUsed }).eq('id', tripId);
  
  if (trip.vehicle_id) {
    await supabase.from('vehicles').update({ status: 'Available', odometer: finalOdometer }).eq('id', trip.vehicle_id);
    // Create fuel log
    await supabase.from('fuel_logs').insert({ vehicle_id: trip.vehicle_id, liters: fuelUsed, cost: fuelUsed * 100, date: new Date().toISOString().split('T')[0] });
  }

  if (trip.driver_id) {
    const { data: d } = await supabase.from('drivers').select('completed_trips').eq('id', trip.driver_id).single();
    await supabase.from('drivers').update({ status: 'Available', completed_trips: (d?.completed_trips || 0) + 1 }).eq('id', trip.driver_id);
  }

  if ((toll || otherExpense) && trip.vehicle_id) {
    await supabase.from('expenses').insert({ trip_id: tripId, vehicle_id: trip.vehicle_id, toll: toll || 0, other: otherExpense || 0, date: new Date().toISOString().split('T')[0] });
  }
}

export async function cancelTrip(tripId: string): Promise<void> {
  const { data: trip } = await supabase.from('trips').select('*').eq('id', tripId).single();
  if (!trip) throw new Error('Trip not found');

  const prevStatus = trip.status;
  await supabase.from('trips').update({ status: 'Cancelled' }).eq('id', tripId);

  if (prevStatus === 'Dispatched') {
    if (trip.vehicle_id) {
      const { data: v } = await supabase.from('vehicles').select('status').eq('id', trip.vehicle_id).single();
      if (v && v.status === 'On Trip') await supabase.from('vehicles').update({ status: 'Available' }).eq('id', trip.vehicle_id);
    }
    if (trip.driver_id) {
      const { data: d } = await supabase.from('drivers').select('status').eq('id', trip.driver_id).single();
      if (d && d.status === 'On Trip') await supabase.from('drivers').update({ status: 'Available' }).eq('id', trip.driver_id);
    }
  }
}

/* ══════════════════════════════════════════════════════════════
   MAINTENANCE
   ══════════════════════════════════════════════════════════════ */
export async function getMaintenanceLogs(): Promise<MaintenanceLog[]> {
  const { data } = await supabase.from('maintenance_logs').select('*').order('date_opened', { ascending: false });
  return (data || []).map(mapMaintenance);
}

export async function openMaintenance(m: Omit<MaintenanceLog, 'id' | 'dateClosed' | 'status'>): Promise<MaintenanceLog> {
  const { data, error } = await supabase.from('maintenance_logs').insert({
    vehicle_id: m.vehicleId, service_type: m.serviceType, cost: m.cost, date_opened: m.dateOpened, status: 'Open'
  }).select().single();
  if (error) throw new Error(error.message);
  
  await supabase.from('vehicles').update({ status: 'In Shop' }).eq('id', m.vehicleId);
  return mapMaintenance(data);
}

export async function closeMaintenance(logId: string): Promise<void> {
  const { data: log } = await supabase.from('maintenance_logs').select('vehicle_id').eq('id', logId).single();
  if (!log) throw new Error('Log not found');
  
  await supabase.from('maintenance_logs').update({ status: 'Closed', date_closed: new Date().toISOString().split('T')[0] }).eq('id', logId);
  
  const { data: v } = await supabase.from('vehicles').select('status').eq('id', log.vehicle_id).single();
  if (v && v.status !== 'Retired') {
    await supabase.from('vehicles').update({ status: 'Available' }).eq('id', log.vehicle_id);
  }
}

/* ══════════════════════════════════════════════════════════════
   FUEL LOGS & EXPENSES
   ══════════════════════════════════════════════════════════════ */
export async function getFuelLogs(): Promise<FuelLog[]> {
  const { data } = await supabase.from('fuel_logs').select('*').order('date', { ascending: false });
  return (data || []).map(mapFuel);
}

export async function addFuelLog(f: Omit<FuelLog, 'id'>): Promise<FuelLog> {
  const { data } = await supabase.from('fuel_logs').insert({
    vehicle_id: f.vehicleId, liters: f.liters, cost: f.cost, date: f.date
  }).select().single();
  return mapFuel(data);
}

export async function updateFuelLog(f: FuelLog): Promise<FuelLog> {
  const { data, error } = await supabase.from('fuel_logs').update({
    vehicle_id: f.vehicleId, liters: f.liters, cost: f.cost, date: f.date
  }).eq('id', f.id).select().single();
  if (error) throw new Error(error.message);
  return mapFuel(data);
}

export async function getExpenses(): Promise<Expense[]> {
  const { data } = await supabase.from('expenses').select('*').order('date', { ascending: false });
  return (data || []).map(mapExpense);
}

export async function addExpense(e: Omit<Expense, 'id'>): Promise<Expense> {
  const { data } = await supabase.from('expenses').insert({
    trip_id: e.tripId, vehicle_id: e.vehicleId, toll: e.toll, other: e.other, date: e.date
  }).select().single();
  return mapExpense(data);
}

export async function updateExpense(e: Expense): Promise<Expense> {
  const { data, error } = await supabase.from('expenses').update({
    trip_id: e.tripId, vehicle_id: e.vehicleId, toll: e.toll, other: e.other, date: e.date
  }).eq('id', e.id).select().single();
  if (error) throw new Error(error.message);
  return mapExpense(data);
}

/* ══════════════════════════════════════════════════════════════
   SETTINGS & RBAC
   ══════════════════════════════════════════════════════════════ */
export async function getSettings(): Promise<Settings> {
  const { data } = await supabase.from('settings').select('*').limit(1).single();
  return data ? { depotName: data.depot_name, currency: data.currency, distanceUnit: data.distance_unit } : 
    { depotName: 'TransitOps Main Depot', currency: '₹', distanceUnit: 'km' };
}

export async function updateSettings(s: Settings): Promise<Settings> {
  const { data: ex } = await supabase.from('settings').select('id').limit(1).single();
  if (ex) {
    await supabase.from('settings').update({ depot_name: s.depotName, currency: s.currency, distance_unit: s.distanceUnit }).eq('id', ex.id);
  } else {
    await supabase.from('settings').insert({ depot_name: s.depotName, currency: s.currency, distance_unit: s.distanceUnit });
  }
  return s;
}

export async function getRolePermissions(): Promise<RolePermission[]> {
  const { data } = await supabase.from('role_permissions').select('*');
  return (data || []).map(r => ({ role: r.role, module: r.module, access: r.access }));
}

let cachedPerms: RolePermission[] = [];
getRolePermissions().then(p => cachedPerms = p);

export function hasAccess(role: UserRole, module: string): 'full' | 'view' | 'none' {
  const p = cachedPerms.find(x => x.role === role && x.module === module);
  return p?.access || 'none';
}

function mapUser(row: any): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    role: row.role as UserRole,
    failedAttempts: row.failed_attempts || 0,
    lockedUntil: row.locked_until
  };
}

export async function getUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*').order('email');
  return (data || []).map(mapUser);
}

export async function addUser(u: Omit<User, 'id' | 'failedAttempts' | 'lockedUntil'>): Promise<User> {
  const { data, error } = await supabase.from('users').insert({
    email: u.email,
    password: u.password,
    role: u.role,
    failed_attempts: 0,
    locked_until: null
  }).select().single();
  if (error) throw new Error(error.message);
  return mapUser(data);
}

export async function updateUser(u: User): Promise<User> {
  const { data, error } = await supabase.from('users').update({
    email: u.email,
    password: u.password,
    role: u.role,
    failed_attempts: u.failedAttempts,
    locked_until: u.lockedUntil
  }).eq('id', u.id).select().single();
  if (error) throw new Error(error.message);
  return mapUser(data);
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
