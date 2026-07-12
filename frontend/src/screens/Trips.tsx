import { useState, useEffect } from 'react';
import { getTrips, getDispatchVehicles, getDispatchDrivers, addTrip, dispatchTrip, completeTrip, cancelTrip, getVehicles, getDrivers } from '../lib/store';
import type { Vehicle, Driver, Trip, Settings } from '../types';
import { Send, CheckCircle, XCircle } from 'lucide-react';

const tripBadge: Record<string, string> = { Draft: 'badge-orange', Dispatched: 'badge-blue', Completed: 'badge-green', Cancelled: 'badge-red' };

export default function TripsScreen({ settings, readOnly }: { settings: Settings; readOnly: boolean }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [poolVehicles, setPoolVehicles] = useState<Vehicle[]>([]);
  const [poolDrivers, setPoolDrivers] = useState<Driver[]>([]);
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState('');
  const [showComplete, setShowComplete] = useState<string | null>(null);
  const [completeForm, setCompleteForm] = useState({ finalOdo: 0, fuel: 0, toll: 0, other: 0 });

  const blankForm = { source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: 0, plannedDistance: 0, revenue: 0, remarks: '' };
  const [form, setForm] = useState(blankForm);

  useEffect(() => { load(); }, []);
  const load = async () => {
    setTrips(await getTrips());
    setPoolVehicles(await getDispatchVehicles());
    setPoolDrivers(await getDispatchDrivers());
    setAllVehicles(await getVehicles());
    setAllDrivers(await getDrivers());
  };

  const selectedVehicle = poolVehicles.find(v => v.id === form.vehicleId);
  const overCapacity = selectedVehicle && form.cargoWeight > selectedVehicle.maxLoadCapacity;
  const overBy = selectedVehicle ? form.cargoWeight - selectedVehicle.maxLoadCapacity : 0;

  const handleCreate = async () => {
    setError('');
    try {
      await addTrip({ ...form, finalOdometer: null, fuelUsed: null, status: 'Draft' });
      setForm(blankForm);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const handleDispatch = async (id: string) => {
    try { await dispatchTrip(id); load(); } catch (e: any) { alert(e.message); }
  };

  const handleCancel = async (id: string) => {
    try { await cancelTrip(id); load(); } catch (e: any) { alert(e.message); }
  };

  const handleComplete = async () => {
    if (!showComplete) return;
    try {
      await completeTrip(showComplete, completeForm.finalOdo, completeForm.fuel, completeForm.toll, completeForm.other);
      setShowComplete(null);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const sorted = [...trips].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <div className="lifecycle">
        {['Draft', 'Dispatched', 'Completed'].map((s, i) => (
          <span key={s}>{i > 0 && <span className="lifecycle-arrow"> → </span>}<span className="lifecycle-step">{s}</span></span>
        ))}
        <span className="lifecycle-arrow"> ↗ </span><span className="lifecycle-step" style={{ background: 'rgba(224,49,49,.15)', color: '#ff6b6b', borderColor: 'var(--accent-red)' }}>Cancelled</span>
      </div>

      <div className="panel-grid-3">
        {!readOnly && (
          <div className="panel">
            <div className="panel-header"><h3>Initialize Dispatch</h3></div>
            <div className="form-group"><label className="form-label">Source</label><input className="form-input" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="e.g. Mumbai" /></div>
            <div className="form-group"><label className="form-label">Destination</label><input className="form-input" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Pune" /></div>
            <div className="form-group">
              <label className="form-label">Vehicle (Available only)</label>
              <select className="form-select" value={form.vehicleId} onChange={e => setForm({ ...form, vehicleId: e.target.value })}>
                <option value="">Select Vehicle</option>
                {poolVehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.nameModel} ({v.maxLoadCapacity}kg)</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Driver (Available only)</label>
              <select className="form-select" value={form.driverId} onChange={e => setForm({ ...form, driverId: e.target.value })}>
                <option value="">Select Driver</option>
                {poolDrivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.licenseCategory}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Cargo Weight (kg)</label><input className={`form-input ${overCapacity ? 'error' : ''}`} type="number" value={form.cargoWeight || ''} onChange={e => setForm({ ...form, cargoWeight: +e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Planned Distance ({settings.distanceUnit})</label><input className="form-input" type="number" value={form.plannedDistance || ''} onChange={e => setForm({ ...form, plannedDistance: +e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Revenue ({settings.currency})</label><input className="form-input" type="number" value={form.revenue || ''} onChange={e => setForm({ ...form, revenue: +e.target.value })} /></div>

            {overCapacity && (
              <div className="capacity-warning">
                <div className="row"><span>Vehicle Capacity</span><span>{selectedVehicle?.maxLoadCapacity} kg</span></div>
                <div className="row"><span>Cargo Weight</span><span>{form.cargoWeight} kg</span></div>
                <div className="row" style={{ fontWeight: 600 }}><span>Over By</span><span>{overBy} kg</span></div>
              </div>
            )}

            {error && <div className="form-error mt-8">{error}</div>}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleCreate} disabled={!!overCapacity || !form.source || !form.vehicleId || !form.driverId}>
                <Send size={14} /> Create Draft
              </button>
              <button className="btn btn-ghost" onClick={() => setForm(blankForm)}>Clear</button>
            </div>
          </div>
        )}

        <div className="panel" style={{ gridColumn: readOnly ? '1 / -1' : undefined }}>
          <div className="panel-header"><h3>Live Deployment Board</h3></div>
          <div className="table-body" style={{ maxHeight: 520 }}>
            <table className="data-table">
              <thead><tr><th>Route</th><th>Vehicle</th><th>Driver</th><th>Cargo</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {sorted.map(t => {
                  const v = allVehicles.find(x => x.id === t.vehicleId);
                  const d = allDrivers.find(x => x.id === t.driverId);
                  return (
                    <tr key={t.id}>
                      <td style={{ color: 'var(--text-main)' }}>{t.source} → {t.destination}</td>
                      <td>{v?.regNumber || <span style={{ color: 'var(--accent-orange)' }}>awaiting</span>}</td>
                      <td>{d?.name || <span style={{ color: 'var(--accent-orange)' }}>awaiting</span>}</td>
                      <td>{t.cargoWeight} kg</td>
                      <td><span className={`badge ${tripBadge[t.status]}`}>{t.status}</span></td>
                      <td>
                        <div className="flex gap-8">
                          {t.status === 'Draft' && !readOnly && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => handleDispatch(t.id)}><Send size={12} /> Dispatch</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => handleCancel(t.id)}><XCircle size={12} /></button>
                            </>
                          )}
                          {t.status === 'Dispatched' && !readOnly && (
                            <>
                              <button className="btn btn-primary btn-sm" onClick={() => { setShowComplete(t.id); setCompleteForm({ finalOdo: v?.odometer || 0, fuel: 0, toll: 0, other: 0 }); }}><CheckCircle size={12} /> Complete</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleCancel(t.id)}><XCircle size={12} /></button>
                            </>
                          )}
                          {(t.status === 'Completed' || t.status === 'Cancelled') && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Final</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showComplete && (
        <div className="modal-overlay" onClick={() => setShowComplete(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Complete Trip</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Final Odometer ({settings.distanceUnit})</label><input className="form-input" type="number" value={completeForm.finalOdo || ''} onChange={e => setCompleteForm({ ...completeForm, finalOdo: +e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Fuel Used (liters)</label><input className="form-input" type="number" value={completeForm.fuel || ''} onChange={e => setCompleteForm({ ...completeForm, fuel: +e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Toll ({settings.currency})</label><input className="form-input" type="number" value={completeForm.toll || ''} onChange={e => setCompleteForm({ ...completeForm, toll: +e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Other Expenses ({settings.currency})</label><input className="form-input" type="number" value={completeForm.other || ''} onChange={e => setCompleteForm({ ...completeForm, other: +e.target.value })} /></div>
            </div>
            <div className="form-actions">
              <button className="btn btn-success" onClick={handleComplete}>Confirm Completion</button>
              <button className="btn btn-ghost" onClick={() => setShowComplete(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
