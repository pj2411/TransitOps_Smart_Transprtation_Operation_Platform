import { useState, useEffect } from 'react';
import { getFuelLogs, getExpenses, getVehicles, getTrips, getMaintenanceLogs, addFuelLog, addExpense } from '../lib/store';
import type { FuelLog, Expense, Vehicle, Trip, MaintenanceLog, Settings } from '../types';
import { Plus } from 'lucide-react';

const fmt = (n: number, s: Settings) => `${s.currency}${n.toLocaleString('en-IN')}`;
const tripBadge: Record<string, string> = { Draft: 'badge-orange', Dispatched: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };

export default function FuelScreen({ settings }: { settings: Settings }) {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [maint, setMaint] = useState<MaintenanceLog[]>([]);
  const [showFuel, setShowFuel] = useState(false);
  const [showExp, setShowExp] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', liters: 0, cost: 0, date: new Date().toISOString().split('T')[0] });
  const [expForm, setExpForm] = useState({ tripId: '', vehicleId: '', toll: 0, other: 0, date: new Date().toISOString().split('T')[0] });

  useEffect(() => { load(); }, []);
  const load = async () => {
    setFuelLogs(await getFuelLogs()); setExpenses(await getExpenses());
    setVehicles(await getVehicles()); setTrips(await getTrips());
    setMaint(await getMaintenanceLogs());
  };

  const saveFuel = async () => { await addFuelLog(fuelForm); setShowFuel(false); load(); };
  const saveExp = async () => { await addExpense({ ...expForm, tripId: expForm.tripId || null }); setShowExp(false); load(); };

  const totalFuel = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const totalMaint = maint.reduce((s, m) => s + m.cost, 0);
  const totalOps = totalFuel + totalMaint;

  const maintCostByVehicle = (vid: string) => maint.filter(m => m.vehicleId === vid).reduce((s, m) => s + m.cost, 0);

  return (
    <div>
      {/* Fuel Logs */}
      <div className="table-wrap mb-16">
        <div className="table-header">
          <h3>Fuel Logs</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowFuel(true)}><Plus size={14} /> Log Fuel</button>
        </div>
        <div className="table-body">
          <table className="data-table">
            <thead><tr><th>Vehicle</th><th>Date</th><th>Liters</th><th>Cost</th></tr></thead>
            <tbody>
              {fuelLogs.map(f => {
                const v = vehicles.find(x => x.id === f.vehicleId);
                return (
                  <tr key={f.id}>
                    <td style={{ color: 'var(--text-main)' }}>{v?.regNumber || '—'}</td>
                    <td>{f.date}</td>
                    <td>{f.liters}</td>
                    <td>{fmt(f.cost, settings)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div className="table-wrap mb-16">
        <div className="table-header">
          <h3>Other Expenses</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowExp(true)}><Plus size={14} /> Add Expense</button>
        </div>
        <div className="table-body">
          <table className="data-table">
            <thead><tr><th>Trip</th><th>Vehicle</th><th>Toll</th><th>Other</th><th>Maint. Linked</th><th>Status</th></tr></thead>
            <tbody>
              {expenses.map(e => {
                const v = vehicles.find(x => x.id === e.vehicleId);
                const t = trips.find(x => x.id === e.tripId);
                return (
                  <tr key={e.id}>
                    <td>{t ? `${t.source}→${t.destination}` : '—'}</td>
                    <td style={{ color: 'var(--text-main)' }}>{v?.regNumber || '—'}</td>
                    <td>{fmt(e.toll, settings)}</td>
                    <td>{fmt(e.other, settings)}</td>
                    <td>{fmt(maintCostByVehicle(e.vehicleId), settings)}</td>
                    <td>{t && <span className={`badge ${tripBadge[t.status]}`}>{t.status}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total */}
      <div className="panel" style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        <div><span className="form-label">Total Fuel</span><div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent-blue)' }}>{fmt(totalFuel, settings)}</div></div>
        <span style={{ fontSize: 24, color: 'var(--text-dim)' }}>+</span>
        <div><span className="form-label">Total Maintenance</span><div style={{ fontSize: 20, fontWeight: 600, color: 'var(--accent-orange)' }}>{fmt(totalMaint, settings)}</div></div>
        <span style={{ fontSize: 24, color: 'var(--text-dim)' }}>=</span>
        <div><span className="form-label">Total Operational Cost</span><div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-green)' }}>{fmt(totalOps, settings)}</div></div>
      </div>

      {/* Fuel Modal */}
      {showFuel && (
        <div className="modal-overlay" onClick={() => setShowFuel(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Record Fuel</h3>
            <div className="form-group"><label className="form-label">Vehicle</label>
              <select className="form-select" value={fuelForm.vehicleId} onChange={e => setFuelForm({ ...fuelForm, vehicleId: e.target.value })}>
                <option value="">Select</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Liters</label><input className="form-input" type="number" value={fuelForm.liters || ''} onChange={e => setFuelForm({ ...fuelForm, liters: +e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Cost</label><input className="form-input" type="number" value={fuelForm.cost || ''} onChange={e => setFuelForm({ ...fuelForm, cost: +e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" max="2099-12-31" value={fuelForm.date} onChange={e => setFuelForm({ ...fuelForm, date: e.target.value })} /></div>
            <div className="form-actions"><button className="btn btn-primary" onClick={saveFuel}>Save</button><button className="btn btn-ghost" onClick={() => setShowFuel(false)}>Cancel</button></div>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExp && (
        <div className="modal-overlay" onClick={() => setShowExp(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Add Expense</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Trip (optional)</label>
                <select className="form-select" value={expForm.tripId} onChange={e => setExpForm({ ...expForm, tripId: e.target.value })}>
                  <option value="">None</option>{trips.map(t => <option key={t.id} value={t.id}>{t.source}→{t.destination}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Vehicle</label>
                <select className="form-select" value={expForm.vehicleId} onChange={e => setExpForm({ ...expForm, vehicleId: e.target.value })}>
                  <option value="">Select</option>{vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Toll</label><input className="form-input" type="number" value={expForm.toll || ''} onChange={e => setExpForm({ ...expForm, toll: +e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Other</label><input className="form-input" type="number" value={expForm.other || ''} onChange={e => setExpForm({ ...expForm, other: +e.target.value })} /></div>
            </div>
            <div className="form-actions"><button className="btn btn-primary" onClick={saveExp}>Save</button><button className="btn btn-ghost" onClick={() => setShowExp(false)}>Cancel</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
