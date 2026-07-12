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

export const roiPerVehicle = [
  { vehicle: "GTO-A98721", roi: 42 },
  { vehicle: "GTO-A88491", roi: 61 },
  { vehicle: "GTO-C55420", roi: 18 },
  { vehicle: "GTO-B11245", roi: -5 },
  { vehicle: "TRK-12", roi: 55 },
];

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
