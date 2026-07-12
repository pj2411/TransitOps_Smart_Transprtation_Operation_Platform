export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type Vehicle = {
  id: string;
  reg: string;
  model: string;
  type: "Van" | "Truck" | "Mini";
  capacity: number;
  odometer: number;
  acqCost: number;
  status: VehicleStatus;
};

export const vehicles: Vehicle[] = [
  { id: "v1", reg: "GTO-A98721", model: "Van-05", type: "Van", capacity: 500, odometer: 6_30_000, acqCost: 94_000, status: "Available" },
  { id: "v2", reg: "GTO-A88491", model: "Truck-8", type: "Truck", capacity: 3000, odometer: 2_10_000, acqCost: 189_000, status: "On Trip" },
  { id: "v3", reg: "GTO-A00120", model: "Mini-05", type: "Mini", capacity: 250, odometer: 4_10_000, acqCost: 60_000, status: "In Shop" },
  { id: "v4", reg: "GTO-A00081", model: "Van-04", type: "Van", capacity: 480, odometer: 8_10_000, acqCost: 84_000, status: "Retired" },
  { id: "v5", reg: "GTO-B11245", model: "Truck-12", type: "Truck", capacity: 5000, odometer: 1_20_000, acqCost: 240_000, status: "Available" },
  { id: "v6", reg: "GTO-C55420", model: "Mini-03", type: "Mini", capacity: 300, odometer: 3_45_000, acqCost: 68_000, status: "Available" },
];

export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type Driver = {
  id: string;
  name: string;
  license: string;
  category: string;
  expiry: string;
  contact: string;
  tripCompl: number;
  safety: number;
  status: DriverStatus;
};

export const drivers: Driver[] = [
  { id: "d1", name: "Alex Morgan", license: "DL-999015", category: "LMV", expiry: "2026-08-14", contact: "+91 98120 xxxxx", tripCompl: 96, safety: 92, status: "Available" },
  { id: "d2", name: "Jose Delacruz", license: "DL-441420", category: "HMV", expiry: "2026-03-30", contact: "+91 98322 xxxxx", tripCompl: 97, safety: 88, status: "Suspended" },
  { id: "d3", name: "Maya Patel", license: "DL-772035", category: "LMV", expiry: "2026-09-22", contact: "+91 97441 xxxxx", tripCompl: 92, safety: 76, status: "On Trip" },
  { id: "d4", name: "Nikhil Rao", license: "DL-410975", category: "HMV", expiry: "2026-07-30", contact: "+91 99110 xxxxx", tripCompl: 88, safety: 55, status: "Off Duty" },
  { id: "d5", name: "Priya Shah", license: "DL-661200", category: "LMV", expiry: "2027-01-11", contact: "+91 90333 xxxxx", tripCompl: 99, safety: 95, status: "Available" },
];

export type TripStatus = "Draft" | "Dispatched" | "On Trip" | "Completed" | "Cancelled";
export type Trip = {
  id: string;
  vehicleReg: string;
  driver: string;
  source: string;
  destination: string;
  cargoKg: number;
  eta: string;
  status: TripStatus;
};

export const trips: Trip[] = [
  { id: "TR001", vehicleReg: "GTO-A98721", driver: "Alex Morgan", source: "Ranchhannagar Depot", destination: "Industrial Area", cargoKg: 420, eta: "45 min", status: "On Trip" },
  { id: "TR002", vehicleReg: "GTO-B11245", driver: "Jose Delacruz", source: "Central Warehouse", destination: "Sector 7 Mall", cargoKg: 2800, eta: "2h 10m", status: "Completed" },
  { id: "TR003", vehicleReg: "GTO-C55420", driver: "Maya Patel", source: "Karol Depot", destination: "North Yard", cargoKg: 210, eta: "1h 05m", status: "Dispatched" },
  { id: "TR004", vehicleReg: "GTO-A88491", driver: "Priya Shah", source: "East Hub", destination: "Airport Cargo", cargoKg: 3100, eta: "3h 20m", status: "Draft" },
  { id: "TR005", vehicleReg: "GTO-A00120", driver: "Nikhil Rao", source: "West Storage", destination: "Client Site B", cargoKg: 260, eta: "50 min", status: "Cancelled" },
];

export const kpi = {
  activeVehicles: 53,
  availableVehicles: 42,
  inMaintenance: 5,
  activeTrips: 18,
  pausedTrips: 9,
  driversOnDuty: 26,
  fleetUtilization: 81,
};

export const monthlyFinancials = [
  { month: "Jan", cost: 28000, revenue: 42000 },
  { month: "Feb", cost: 31000, revenue: 45000 },
  { month: "Mar", cost: 29500, revenue: 48000 },
  { month: "Apr", cost: 34000, revenue: 51000 },
  { month: "May", cost: 33500, revenue: 55000 },
  { month: "Jun", cost: 36000, revenue: 58000 },
  { month: "Jul", cost: 34070, revenue: 61000 },
];

export const fuelLogs = [
  { id: "f1", vehicle: "GTO-A98721", date: "2026-07-08", liters: 42, cost: 3980 },
  { id: "f2", vehicle: "GTO-A88491", date: "2026-07-06", liters: 70, cost: 6600 },
  { id: "f3", vehicle: "GTO-C55420", date: "2026-07-05", liters: 25, cost: 2360 },
  { id: "f4", vehicle: "GTO-B11245", date: "2026-07-03", liters: 95, cost: 8920 },
];

export const serviceLogs = [
  { id: "s1", vehicle: "GTO-A98721", service: "Oil Change", cost: 2200, status: "In Shop" },
  { id: "s2", vehicle: "GTO-A88491", service: "Engine Repair", cost: 18000, status: "Completed" },
  { id: "s3", vehicle: "GTO-C55420", service: "Tyre Replace", cost: 6200, status: "In Shop" },
];

export const expenses = [
  { id: "e1", vehicle: "GTO-A98721", toll: 120, other: 0, amount: 120, status: "Available" },
  { id: "e2", vehicle: "TRK-12", toll: 340, other: 150, amount: 15000, status: "Completed" },
];

export const roiPerVehicle = vehicles.slice(0, 5).map((v, i) => ({
  vehicle: v.reg,
  roi: [42, 61, 18, -5, 55][i],
}));

export const fuelEfficiency = [
  { month: "Jan", kml: 7.8 },
  { month: "Feb", kml: 8.1 },
  { month: "Mar", kml: 8.0 },
  { month: "Apr", kml: 8.3 },
  { month: "May", kml: 8.5 },
  { month: "Jun", kml: 8.2 },
  { month: "Jul", kml: 8.4 },
];

export const costBreakdown = [
  { name: "Fuel", value: 42 },
  { name: "Maintenance", value: 22 },
  { name: "Salaries", value: 26 },
  { name: "Tolls & Misc", value: 10 },
];

export const notifications = [
  { id: "n1", title: "License expiring soon", body: "Jose Delacruz — DL-441420 expires in 21 days", type: "warning" as const },
  { id: "n2", title: "Vehicle overdue for service", body: "GTO-B11245 crossed 10,000 km since last service", type: "warning" as const },
  { id: "n3", title: "Trip TR003 dispatched", body: "Maya Patel is en route to North Yard", type: "info" as const },
  { id: "n4", title: "Fuel receipt logged", body: "GTO-A98721 — ₹3,980", type: "success" as const },
];

export const roles = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"] as const;
export type Role = (typeof roles)[number];
