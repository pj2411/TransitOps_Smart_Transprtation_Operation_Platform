import { useState, useEffect } from 'react';
import { getVehicles, addVehicle, updateVehicle, deleteVehicle } from '../lib/store';
import type { Vehicle, VehicleStatus, Settings } from '../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const STATUSES: VehicleStatus[] = ['Available', 'On Trip', 'In Shop', 'Retired'];
const TYPES = ['Van', 'Truck', 'Mini'];
const badgeMap: Record<string, string> = { Available: 'badge-green', 'On Trip': 'badge-blue', 'In Shop': 'badge-orange', Retired: 'badge-gray' };

const fmt = (n: number, s: Settings) => `${s.currency}${n.toLocaleString('en-IN')}`;

export default function VehiclesScreen({ settings }: { settings: Settings }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeF, setTypeF] = useState('All');
  const [statusF, setStatusF] = useState('All');

  const blank: Omit<Vehicle, 'id'> = { regNumber: '', nameModel: '', type: 'Van', maxLoadCapacity: 0, odometer: 0, acquisitionCost: 0, status: 'Available' };
  const [form, setForm] = useState<Omit<Vehicle, 'id'>>(blank);

  useEffect(() => { load(); }, []);
  const load = async () => setVehicles(await getVehicles());

  const openAdd = () => { setForm(blank); setEditing(null); setError(''); setShowForm(true); };
  const openEdit = (v: Vehicle) => { setForm(v); setEditing(v); setError(''); setShowForm(true); };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) await updateVehicle({ ...form, id: editing.id } as Vehicle);
      else await addVehicle(form);
      setShowForm(false);
      load();
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return;
    try {
      await deleteVehicle(id);
      load();
    } catch (e: any) { alert(e.message); }
  };

  const filtered = vehicles
    .filter(v => typeF === 'All' || v.type === typeF)
    .filter(v => statusF === 'All' || v.status === statusF)
    .filter(v => !search || v.regNumber.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="filter-bar">
        <input className="form-input" style={{ width: 220 }} placeholder="Search Reg No..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ width: 140 }} value={typeF} onChange={e => setTypeF(e.target.value)}>
          <option>All</option>{TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="form-select" style={{ width: 140 }} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option>All</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Vehicle</button>
      </div>

      <div className="table-wrap">
        <div className="table-body">
          <table className="data-table">
            <thead><tr><th>Reg No.</th><th>Name / Model</th><th>Type</th><th>Capacity (kg)</th><th>Odometer ({settings.distanceUnit})</th><th>Acq. Cost</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id}>
                  <td style={{ color: 'var(--text-main)', fontWeight: 500 }}>{v.regNumber}</td>
                  <td>{v.nameModel}</td>
                  <td>{v.type}</td>
                  <td>{v.maxLoadCapacity.toLocaleString()}</td>
                  <td>{v.odometer.toLocaleString('en-IN')}</td>
                  <td>{fmt(v.acquisitionCost, settings)}</td>
                  <td><span className={`badge ${badgeMap[v.status]}`}>{v.status}</span></td>
                  <td className="text-right">
                    <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)}><Pencil size={13} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(v.id)}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rule-note">Registration numbers must be unique. Retired / In Shop vehicles are hidden from the Trip Dispatcher.</div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
            <div className="form-group">
              <label className="form-label">Registration Number</label>
              <input className={`form-input ${error.includes('Registration') ? 'error' : ''}`} value={form.regNumber} onChange={e => setForm({ ...form, regNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Name / Model</label>
              <input className="form-input" value={form.nameModel} onChange={e => setForm({ ...form, nameModel: e.target.value })} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Max Load Capacity (kg)</label>
                <input className="form-input" type="number" value={form.maxLoadCapacity || ''} onChange={e => setForm({ ...form, maxLoadCapacity: +e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Odometer ({settings.distanceUnit})</label>
                <input className="form-input" type="number" value={form.odometer || ''} onChange={e => setForm({ ...form, odometer: +e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Acquisition Cost ({settings.currency})</label>
                <input className="form-input" type="number" value={form.acquisitionCost || ''} onChange={e => setForm({ ...form, acquisitionCost: +e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as VehicleStatus })}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {error && <div className="form-error">{error}</div>}
            <div className="form-actions">
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
