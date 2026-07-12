import { useState, useEffect } from 'react';
import { getVehicles, getTrips, getFuelLogs, getMaintenanceLogs } from '../lib/store';
import type { Vehicle, Trip, FuelLog, MaintenanceLog, Settings } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download } from 'lucide-react';

const fmt = (n: number, s: Settings) => `${s.currency}${n.toLocaleString('en-IN')}`;

export default function ReportsScreen({ settings }: { settings: Settings }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [maint, setMaint] = useState<MaintenanceLog[]>([]);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setVehicles(await getVehicles()); setTrips(await getTrips());
    setFuelLogs(await getFuelLogs()); setMaint(await getMaintenanceLogs());
  };

  const completedTrips = trips.filter(t => t.status === 'Completed');
  const totalDistance = completedTrips.reduce((s, t) => s + t.plannedDistance, 0);
  const totalFuelUsed = completedTrips.reduce((s, t) => s + (t.fuelUsed || 0), 0);
  const fuelEfficiency = totalFuelUsed > 0 ? (totalDistance / totalFuelUsed).toFixed(2) : '—';

  const nonRetired = vehicles.filter(v => v.status !== 'Retired');
  const onTrip = vehicles.filter(v => v.status === 'On Trip').length;
  const fleetUtil = nonRetired.length ? Math.round((onTrip / nonRetired.length) * 100) : 0;

  const totalFuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaintCost = maint.reduce((s, m) => s + m.cost, 0);
  const totalOpsCost = totalFuelCost + totalMaintCost;
  const totalRevenue = completedTrips.reduce((s, t) => s + t.revenue, 0);

  // Vehicle ROI data
  const vehicleCosts = vehicles.map(v => {
    const vFuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((s, f) => s + f.cost, 0);
    const vMaint = maint.filter(m => m.vehicleId === v.id).reduce((s, m) => s + m.cost, 0);
    const vRev = completedTrips.filter(t => t.vehicleId === v.id).reduce((s, t) => s + t.revenue, 0);
    const roi = v.acquisitionCost > 0 ? ((vRev - (vMaint + vFuel)) / v.acquisitionCost * 100) : 0;
    return { name: v.regNumber, fuel: vFuel, maint: vMaint, total: vFuel + vMaint, revenue: vRev, roi: Math.round(roi) };
  }).sort((a, b) => b.total - a.total).slice(0, 6);

  // Monthly revenue (mock based on trips)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const monthlyRev = months.map((m, i) => ({ name: m, revenue: Math.round(totalRevenue * (0.5 + Math.random()) / 6) }));

  const exportCSV = () => {
    const rows = [['Vehicle', 'Fuel Cost', 'Maint Cost', 'Revenue', 'ROI %']];
    vehicleCosts.forEach(v => rows.push([v.name, String(v.fuel), String(v.maint), String(v.revenue), String(v.roi)]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'transitops_report.csv'; a.click();
  };

  const metrics = [
    { label: 'Fuel Efficiency', value: `${fuelEfficiency} ${settings.distanceUnit}/L`, color: 'var(--accent-blue)' },
    { label: 'Fleet Utilization', value: `${fleetUtil}%`, color: 'var(--accent-green)' },
    { label: 'Operational Cost', value: fmt(totalOpsCost, settings), color: 'var(--accent-orange)' },
    { label: 'Avg. Vehicle ROI', value: vehicleCosts.length ? `${Math.round(vehicleCosts.reduce((s, v) => s + v.roi, 0) / vehicleCosts.length)}%` : '—', color: 'var(--accent-purple)', sub: '(Revenue − (Maint + Fuel)) / Acq. Cost' },
  ];

  return (
    <div>
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {metrics.map(m => (
          <div key={m.label} className="kpi-card">
            <div className="label">{m.label}</div>
            <div className="value" style={{ color: m.color, fontSize: 24 }}>{m.value}</div>
            {m.sub && <div className="sub">{m.sub}</div>}
          </div>
        ))}
      </div>

      <div className="panel-grid" style={{ marginBottom: 20 }}>
        <div className="chart-container">
          <div className="chart-title">Monthly Revenue</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyRev}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232a31" />
              <XAxis dataKey="name" stroke="#6c757d" fontSize={11} />
              <YAxis stroke="#6c757d" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1c2228', border: '1px solid #232a31', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {monthlyRev.map((_, i) => <Cell key={i} fill="#1971c2" />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <div className="chart-title">Top Costliest Vehicles</div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vehicleCosts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#232a31" />
              <XAxis type="number" stroke="#6c757d" fontSize={11} />
              <YAxis type="category" dataKey="name" stroke="#6c757d" fontSize={10} width={110} />
              <Tooltip contentStyle={{ background: '#1c2228', border: '1px solid #232a31', borderRadius: 6, fontSize: 12 }} />
              <Bar dataKey="fuel" stackId="a" fill="#1971c2" name="Fuel" />
              <Bar dataKey="maint" stackId="a" fill="#f08c00" name="Maintenance" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-12">
        <button className="btn btn-primary" onClick={exportCSV}><Download size={14} /> Export CSV</button>
        <button className="btn btn-ghost" onClick={() => window.print()}><Download size={14} /> Print / PDF</button>
      </div>
    </div>
  );
}
