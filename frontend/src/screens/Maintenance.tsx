import { useState, useEffect } from 'react';
import { getMaintenanceLogs, getVehicles, openMaintenance, closeMaintenance } from '../lib/store';
import type { MaintenanceLog, Vehicle, Settings } from '../types';
import { Plus, CheckCircle } from 'lucide-react';

const fmt = (n: number, s: Settings) => `${s.currency}${n.toLocaleString('en-IN')}`;

export default function MaintenanceScreen({ settings }: { settings: Settings }) {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ vehicleId: '', serviceType: '', cost: 0, dateOpened: new Date().toISOString().split('T')[0] });
  const [error, setError] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => { setLogs(await getMaintenanceLogs()); setVehicles(await getVehicles()); };

  const availableVehicles = vehicles.filter(v => v.status !== 'Retired');

  const handleOpen = async () => {
    setError('');
    if (!form.vehicleId || !form.serviceType) { setError('Please fill all fields'); return; }
    try {
      await openMaintenance(form);
      setForm({ vehicleId: '', serviceType: '', cost: 0, dateOpened: new Date().toISOString().split('T')[0] });
      load();
    } catch (e: any) { setError(e.message); }
  };

  const handleClose = async (id: string) => {
    await closeMaintenance(id);
    load();
  };

  return (
    <div>
      <div className="panel-grid-3">
        <div className="panel">
          <div className="panel-header"><h3>Log a Service</h3></div>
          <div className="form-group">
            <label className="form-label">Vehicle</label>
            <select className="form-select" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
              <option value="">Select Vehicle</option>
              {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.nameModel}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Service Type</label>
            <input className="form-input" value={form.serviceType} onChange={e => setForm({ ...form, serviceType: e.target.value })} placeholder="e.g. Oil Change" />
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Cost ({settings.currency})</label><input className="form-input" type="number" value={form.cost || ''} onChange={e => setForm({ ...form, cost: +e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" max="2099-12-31" value={form.dateOpened} onChange={e => setForm({ ...form, dateOpened: e.target.value })} /></div>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-actions">
            <button className="btn btn-primary" onClick={handleOpen}><Plus size={14} /> Open Record</button>
          </div>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <div className="flex items-center justify-between" style={{ maxWidth: 200, margin: '0 auto' }}>
              <span className="badge badge-green">Available</span>
              <span style={{ color: 'var(--text-dim)' }}>⇄</span>
              <span className="badge badge-orange">In Shop</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 8 }}>Auto-transition on create / close</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h3>Service Records</h3></div>
          <div className="table-body">
            <table className="data-table">
              <thead><tr><th>Vehicle</th><th>Service</th><th>Cost</th><th>Opened</th><th>Closed</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {logs.map(l => {
                  const v = vehicles.find(x => x.id === l.vehicleId);
                  return (
                    <tr key={l.id}>
                      <td style={{ color: 'var(--text-main)' }}>{v?.regNumber || '—'}</td>
                      <td>{l.serviceType}</td>
                      <td>{fmt(l.cost, settings)}</td>
                      <td>{l.dateOpened}</td>
                      <td>{l.dateClosed || '—'}</td>
                      <td><span className={`badge ${l.status === 'Open' ? 'badge-orange' : 'badge-green'}`}>{l.status}</span></td>
                      <td>{l.status === 'Open' && <button className="btn btn-success btn-sm" onClick={() => handleClose(l.id)}><CheckCircle size={12} /> Close</button>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="rule-note">In Shop vehicles are hidden from the dispatch pool.</div>
        </div>
      </div>
    </div>
  );
}
