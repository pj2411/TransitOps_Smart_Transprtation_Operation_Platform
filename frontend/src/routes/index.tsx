import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getVehicles, getDrivers, getTrips, getFuelLogs, getMaintenanceLogs } from "@/lib/store";
import type { Vehicle, Driver, Trip, FuelLog, MaintenanceLog } from "@/types";
import { Truck, CheckCircle2, Wrench, Gauge, TrendingUp, IndianRupee, Percent } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/")({ component: Dashboard });

function KPI({ icon: Icon, label, value, tint }: { icon: any; label: string; value: string; tint: string }) {
  return (
    <Card className="border-border bg-panel p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold text-foreground">{value}</div>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-success">
        <TrendingUp className="h-3 w-3" /> vs last week
      </div>
    </Card>
  );
}

function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);

  // Filter States
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [regionFilter, setRegionFilter] = useState("All");

  useEffect(() => {
    Promise.all([getVehicles(), getDrivers(), getTrips(), getFuelLogs(), getMaintenanceLogs()]).then(([vs, ds, ts, fs, ms]) => {
      setVehicles(vs);
      setDrivers(ds);
      setTrips(ts);
      setFuelLogs(fs);
      setMaintenanceLogs(ms);
    }).catch(console.error);
  }, []);

  const filteredVehicles = vehicles.filter((v) => {
    if (vehicleTypeFilter !== "All" && v.type !== vehicleTypeFilter) return false;
    if (statusFilter !== "All" && v.status !== statusFilter) return false;
    return true;
  });

  const filteredTrips = trips.filter((t) => {
    if (regionFilter !== "All" && t.source !== regionFilter && t.destination !== regionFilter) return false;
    return true;
  });

  // Extract unique regions from trips
  const regions = Array.from(new Set(trips.flatMap(t => [t.source, t.destination]))).sort();

  const kpi = {
    activeTrips: filteredTrips.filter(t => t.status === 'Dispatched').length,
    pausedTrips: filteredTrips.filter(t => t.status === 'Draft').length,
    driversOnDuty: drivers.filter(d => d.status === 'On Trip').length,
    inMaintenance: filteredVehicles.filter(v => v.status === 'In Shop').length,
  };

  // 1. Fuel Efficiency = Distance / Fuel
  // We use sum of plannedDistance of all trips / sum of fuel liters
  const totalDistance = trips.reduce((sum, t) => sum + (t.plannedDistance || 0), 0);
  const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
  const fuelEfficiency = totalFuelLiters > 0 ? (totalDistance / totalFuelLiters).toFixed(2) : "0";

  // 2. Fleet Utilization = Active Vehicles / Total Vehicles
  const activeVehicles = filteredVehicles.filter(v => v.status === 'On Trip').length;
  const fleetUtilization = filteredVehicles.length > 0 ? Math.round((activeVehicles / filteredVehicles.length) * 100) : 0;

  // 3. Operational Cost = Fuel + Maintenance
  const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((sum, m) => sum + m.cost, 0);
  const operationalCost = totalFuelCost + totalMaintenanceCost;

  // 4. Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
  const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const totalAcquisitionCost = vehicles.reduce((sum, v) => sum + (v.acquisitionCost || 0), 0);
  const vehicleRoi = totalAcquisitionCost > 0 
    ? (((totalRevenue - operationalCost) / totalAcquisitionCost) * 100).toFixed(2) 
    : "0";

  // --- Dynamic Monthly Financials ---
  const monthlyData: Record<string, { month: string, cost: number, revenue: number }> = {};
  const addMonth = (dateStr: string, cost: number, rev: number) => {
    if (!dateStr) return;
    const month = dateStr.substring(0, 7);
    if (!monthlyData[month]) monthlyData[month] = { month, cost: 0, revenue: 0 };
    monthlyData[month].cost += cost;
    monthlyData[month].revenue += rev;
  };
  trips.forEach(t => addMonth(t.createdAt, 0, t.revenue));
  fuelLogs.forEach(f => addMonth(f.date, f.cost, 0));
  maintenanceLogs.forEach(m => addMonth(m.dateOpened, m.cost, 0));
  const dynamicFinancials = Object.values(monthlyData)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-7)
    .map(d => ({ ...d, month: new Date(d.month + '-01').toLocaleString('default', { month: 'short' }) }));

  const filterActions = (
    <div className="flex flex-wrap items-center gap-3">
      <Select value={vehicleTypeFilter} onValueChange={setVehicleTypeFilter}>
        <SelectTrigger className="w-[140px] border-border bg-canvas text-xs text-muted-foreground">
          <SelectValue placeholder="Vehicle Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Types</SelectItem>
          <SelectItem value="Van">Van</SelectItem>
          <SelectItem value="Truck">Truck</SelectItem>
          <SelectItem value="Mini">Mini</SelectItem>
        </SelectContent>
      </Select>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-[140px] border-border bg-canvas text-xs text-muted-foreground">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Statuses</SelectItem>
          <SelectItem value="Available">Available</SelectItem>
          <SelectItem value="On Trip">On Trip</SelectItem>
          <SelectItem value="In Shop">In Shop</SelectItem>
          <SelectItem value="Retired">Retired</SelectItem>
        </SelectContent>
      </Select>

      <Select value={regionFilter} onValueChange={setRegionFilter}>
        <SelectTrigger className="w-[140px] border-border bg-canvas text-xs text-muted-foreground">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All">All Regions</SelectItem>
          {regions.map(r => (
            <SelectItem key={r} value={r}>{r}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <PageHeader 
        title="Fleet Command" 
        subtitle="Live overview of vehicles, drivers and trips across your operation." 
        actions={filterActions} 
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI icon={Gauge} label="Fuel Efficiency" value={`${fuelEfficiency} km/L`} tint="bg-info" />
        <KPI icon={Percent} label="Fleet Utilization" value={`${fleetUtilization}%`} tint="bg-primary" />
        <KPI icon={IndianRupee} label="Operational Cost" value={`₹${operationalCost.toLocaleString()}`} tint="bg-danger" />
        <KPI icon={TrendingUp} label="Vehicle ROI" value={`${vehicleRoi}%`} tint="bg-success" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="border-border bg-panel p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Operational Cost vs Revenue</div>
              <div className="text-xs text-muted-foreground">Monthly, in ₹ thousands</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dynamicFinancials}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232a31" />
                <XAxis dataKey="month" stroke="#adb5bd" fontSize={12} />
                <YAxis stroke="#adb5bd" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: "#1c2228", border: "1px solid #232a31", borderRadius: 8 }}
                  labelStyle={{ color: "#e9ecef" }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: "#adb5bd" }} />
                <Bar dataKey="cost" fill="#f08c00" radius={[4, 4, 0, 0]} name="Cost" />
                <Bar dataKey="revenue" fill="#1971c2" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-border bg-panel p-5">
          <div className="mb-3 text-sm font-semibold">Fleet Snapshot</div>
          <div className="space-y-3 text-sm">
            {[
              { k: "Active Trips", v: kpi.activeTrips, tint: "bg-info" },
              { k: "Paused Trips", v: kpi.pausedTrips, tint: "bg-warning" },
              { k: "Drivers On Duty", v: kpi.driversOnDuty, tint: "bg-success" },
              { k: "In Maintenance", v: kpi.inMaintenance, tint: "bg-danger" },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between rounded-md border border-border bg-canvas px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${r.tint}`} />
                  <span className="text-muted-foreground">{r.k}</span>
                </div>
                <span className="font-semibold">{r.v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-6 border-border bg-panel">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <div className="text-sm font-semibold">Recent Trips</div>
            <div className="text-xs text-muted-foreground">Last 5 dispatches</div>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead>Trip ID</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrips.slice(0, 5).map((t) => {
              const v = vehicles.find(x => x.id === t.vehicleId);
              const d = drivers.find(x => x.id === t.driverId);
              return (
                <TableRow key={t.id} className="border-border hover:bg-canvas">
                  <TableCell className="font-medium">{t.id.slice(0, 8)}</TableCell>
                  <TableCell>{v?.regNumber || 'Unknown'}</TableCell>
                  <TableCell>{d?.name || 'Unknown'}</TableCell>
                  <TableCell className="text-muted-foreground">{t.source} → {t.destination}</TableCell>
                  <TableCell><StatusBadge status={t.status} /></TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
