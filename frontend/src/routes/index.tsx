import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { monthlyFinancials } from "@/lib/mock-data";
import { getVehicles, getDrivers, getTrips } from "@/lib/store";
import type { Vehicle, Driver, Trip } from "@/types";
import { Truck, CheckCircle2, Wrench, Gauge, TrendingUp } from "lucide-react";
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

  useEffect(() => {
    Promise.all([getVehicles(), getDrivers(), getTrips()]).then(([vs, ds, ts]) => {
      setVehicles(vs);
      setDrivers(ds);
      setTrips(ts);
    }).catch(console.error);
  }, []);

  const kpi = {
    activeVehicles: vehicles.filter(v => v.status === 'On Trip').length,
    availableVehicles: vehicles.filter(v => v.status === 'Available').length,
    inMaintenance: vehicles.filter(v => v.status === 'In Shop').length,
    activeTrips: trips.filter(t => t.status === 'Dispatched').length,
    pausedTrips: trips.filter(t => t.status === 'Draft').length,
    driversOnDuty: drivers.filter(d => d.status === 'On Trip').length,
    fleetUtilization: vehicles.length ? Math.round((vehicles.filter(v => v.status === 'On Trip' || v.status === 'Available').length / vehicles.length) * 100) : 0,
  };

  return (
    <>
      <PageHeader title="Fleet Command" subtitle="Live overview of vehicles, drivers and trips across your operation." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPI icon={Truck} label="Active Vehicles" value={String(kpi.activeVehicles)} tint="bg-info" />
        <KPI icon={CheckCircle2} label="Available Vehicles" value={String(kpi.availableVehicles)} tint="bg-success" />
        <KPI icon={Wrench} label="In Maintenance" value={String(kpi.inMaintenance)} tint="bg-warning" />
        <KPI icon={Gauge} label="Fleet Utilization" value={`${kpi.fleetUtilization}%`} tint="bg-primary" />
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
              <BarChart data={monthlyFinancials}>
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
            {trips.slice(0, 5).map((t) => {
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
