import { useState, useEffect } from 'react';
import { getVehicles, getDrivers, getTrips } from '../lib/store';
import type { Vehicle, Driver, Trip, Settings } from '../types';

const statusColor: Record<string, string> = { Available: '#2f9e44', 'On Trip': '#1971c2', 'In Shop': '#f08c00', Retired: '#6c757d' };
const tripBadge: Record<string, string> = { Draft: 'badge-orange', Dispatched: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };

export default function DashboardScreen({ settings }: { settings: Settings }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => { load(); }, []);
  const load = async () => {
    setVehicles(await getVehicles());
    setDrivers(await getDrivers());
    setTrips(await getTrips());
  };

  const fv = vehicles.filter(v => (typeFilter === 'All' || v.type === typeFilter) && (statusFilter === 'All' || v.status === statusFilter));
  const nonRetired = fv.filter(v => v.status !== 'Retired');
  const active = fv.filter(v => v.status === 'On Trip').length;
  const available = fv.filter(v => v.status === 'Available').length;
  const inShop = fv.filter(v => v.status === 'In Shop').length;
  const utilization = nonRetired.length ? Math.round((active / nonRetired.length) * 100) : 0;
  const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTrips = trips.filter(t => t.status === 'Draft').length;
  const driversOnDuty = drivers.filter(d => d.status === 'On Trip').length;

  const kpis = [
    { label: 'Active Vehicles', value: active, color: 'var(--accent-blue)' },
    { label: 'Available Vehicles', value: available, color: 'var(--accent-green)' },
    { label: 'In Maintenance', value: inShop, color: 'var(--accent-orange)' },
    { label: 'Active Trips', value: activeTrips, color: 'var(--accent-blue)' },
    { label: 'Pending Trips', value: pendingTrips, color: 'var(--accent-orange)' },
    { label: 'Drivers On Duty', value: driversOnDuty, color: 'var(--accent-green)' },
    { label: 'Fleet Utilization', value: `${utilization}%`, color: 'var(--accent-purple)' },
  ];

  const types = ['All', 'Van', 'Truck', 'Mini'];
  const statuses = ['All', 'Available', 'On Trip', 'In Shop', 'Retired'];
  const recentTrips = [...trips].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const statusCounts: Record<string, number> = {};
  vehicles.forEach(v => { statusCounts[v.status] = (statusCounts[v.status] || 0) + 1; });
  const total = vehicles.length || 1;

  return (
    <div>
      <div className="filter-bar">
        <select className="form-select" style={{ width: 160 }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          {types.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {statuses.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="kpi-grid">
        {kpis.map(k => (
          <div key={k.label} className="kpi-card">
            <div className="label">{k.label}</div>
            <div className="value" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="panel-grid">
        <div className="panel">
          <div className="panel-header"><h3>Recent Trips</h3></div>
          <table className="data-table">
            <thead><tr><th>Trip</th><th>Route</th><th>Vehicle</th><th>Driver</th><th>Status</th></tr></thead>
            <tbody>
              {recentTrips.map(t => {
                const v = vehicles.find(x => x.id === t.vehicleId);
                const d = drivers.find(x => x.id === t.driverId);
                return (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text-main)', fontWeight: 500 }}>{t.id.slice(0, 8)}</td>
                    <td>{t.source} → {t.destination}</td>
                    <td>{v?.regNumber || '—'}</td>
                    <td>{d?.name || '—'}</td>
                    <td><span className={`badge ${tripBadge[t.status]}`}>{t.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-header"><h3>Vehicle Status Distribution</h3></div>
          <div className="status-bar" style={{ marginBottom: 16 }}>
            {Object.entries(statusCounts).map(([s, c]) => (
              <div key={s} style={{ width: `${(c / total) * 100}%`, background: statusColor[s] || '#6c757d' }}>{c}</div>
            ))}
          </div>
          <div className="flex gap-16" style={{ flexWrap: 'wrap' }}>
            {Object.entries(statusCounts).map(([s, c]) => (
              <div key={s} className="flex items-center gap-8" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: statusColor[s] || '#6c757d' }} />
                {s}: {c}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
