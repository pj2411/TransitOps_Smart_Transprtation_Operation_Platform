/* ──────────────────── TransitOps Type Definitions ──────────────────── */

export type UserRole = 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst';
export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';
export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
export type MaintenanceStatus = 'Open' | 'Closed';
export type AccessLevel = 'full' | 'view' | 'none';
export type Module = 'Fleet' | 'Drivers' | 'Trips' | 'Fuel-Exp' | 'Analytics' | 'Settings';

export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  failedAttempts: number;
  lockedUntil: string | null;
}

export interface Vehicle {
  id: string;
  regNumber: string;
  nameModel: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: VehicleStatus;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  totalTrips: number;
  completedTrips: number;
  status: DriverStatus;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number;
  plannedDistance: number;
  revenue: number;
  finalOdometer: number | null;
  fuelUsed: number | null;
  remarks: string;
  status: TripStatus;
  createdAt: string;
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  serviceType: string;
  cost: number;
  dateOpened: string;
  dateClosed: string | null;
  status: MaintenanceStatus;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
}

export interface Expense {
  id: string;
  tripId: string | null;
  vehicleId: string;
  toll: number;
  other: number;
  date: string;
}

export interface Settings {
  depotName: string;
  currency: string;
  distanceUnit: string;
}

export interface RolePermission {
  role: UserRole;
  module: Module;
  access: AccessLevel;
}

export type ViewName =
  | 'login'
  | 'dashboard'
  | 'vehicles'
  | 'drivers'
  | 'trips'
  | 'maintenance'
  | 'fuel'
  | 'reports'
  | 'settings';
