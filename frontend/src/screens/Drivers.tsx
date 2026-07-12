import { useState, useEffect } from 'react';
import { getDrivers, addDriver, updateDriver, deleteDriver } from '../lib/store';
import type { Driver, DriverStatus, UserRole } from '../types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const STATUSES: DriverStatus[] = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
const badgeMap: Record<string, string> = { Available: 'badge-green', 'On Trip': 'badge-blue', 'Off Duty': 'badge-gray', Suspended: 'badge-red' };

function daysUntilExpiry(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000); }

export default function DriversScreen({ role }: { role: UserRole }) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [error, setError] = useState('');
  const [statusF, setStatusF] = useState('All');
  const [search, setSearch] = useState('');

  const blank: Omit<Driver, 'id'> = { name: '', licenseNumber: '', licenseCategory: 'LMV', licenseExpiryDate: '', contactNumber: '', safetyScore: 80, totalTrips: 0, completedTrips: 0, status: 'Available' };
  const [form, setForm] = useState<Omit<Driver, 'id'>>(blank);

  useEffect(() => { load(); }, []);
  const load = async () => setDrivers(await getDrivers());

  const openAdd = () => { setForm(blank); setEditing(null); setError(''); setShowForm(true); };
  const openEdit = (d: Driver) => { setForm(d); setEditing(d); setError(''); setShowForm(true); };

  const handleSave = async () => {
    setError('');
    try {
      if (editing) await updateDriver({ ...form, id: editing.id } as Driver);
      else await addDriver(form);
      setShowForm(false); load();
    } catch (e: any) { setError(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this driver?')) {
      try {
        await deleteDriver(id);
        load();
      } catch (e: any) { alert(e.message); }
    }
  };

  const filtered = drivers.filter(d => {
    const matchStatus = statusF === 'All' || d.status === statusF;
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.licenseNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-16">
        <input 
          className="topbar-search" 
          placeholder="Search drivers or license..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ width: 300, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', color: 'var(--text-main)' }}
        />
        <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Driver</button>
      </div>

      <div className="table-wrap">
        <div className="table-body">
          <table className="data-table">
            <thead>
              <tr>
                <th>DRIVER</th>
                <th>LICENSE NO</th>
                <th>CATEGORY</th>
                <th>EXPIRY</th>
                <th>CONTACT</th>
                <th>TRIP COMPL.</th>
                <th>SAFETY SCORE</th>
                <th>STATUS</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const days = daysUntilExpiry(d.licenseExpiryDate);
                const expired = days <= 30;
                const compl = d.totalTrips > 0 ? Math.round((d.completedTrips / d.totalTrips) * 100) : 0;
                return (
                  <tr key={d.id}>
                    <td style={{ color: 'var(--text-main)', fontWeight: 500 }}>{d.name}</td>
                    <td>{d.licenseNumber}</td>
                    <td>{d.licenseCategory}</td>
                    <td>
                      {d.licenseExpiryDate}
                      {expired && <span style={{ color: 'var(--accent-red)', fontSize: 11, marginLeft: 8, fontWeight: 600 }}>EXPIRE</span>}
                    </td>
                    <td>{d.contactNumber}</td>
                    <td>{compl}%</td>
                    <td>
                      <span className={`badge ${d.safetyScore >= 80 ? 'badge-green' : d.safetyScore >= 60 ? 'badge-orange' : 'badge-red'}`}>
                        {d.safetyScore}%
                      </span>
                    </td>
                    <td><span className={`badge ${badgeMap[d.status]}`}>{d.status}</span></td>
                    <td className="text-right">
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(d)}><Pencil size={13} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(d.id)}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-16">
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Toggle Stat</div>
        <div className="flex gap-8">
          {['All', ...STATUSES].map(s => (
            <button 
              key={s} 
              className={`filter-chip ${statusF === s ? 'active' : ''}`} 
              onClick={() => setStatusF(s)}
              style={statusF === s && s !== 'All' ? { background: `var(--accent-${s === 'Available' ? 'green' : s === 'On Trip' ? 'blue' : s === 'Suspended' ? 'orange' : 'gray'})`, color: '#fff', borderColor: 'transparent' } : {}}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="rule-note mt-16" style={{ color: 'var(--accent-orange)' }}>
          Rule: Expired license or Suspended status → blocked from trip assignment
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{editing ? 'Edit Driver' : 'Add New Driver'}</h3>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Contact Number</label><input className="form-input" value={form.contactNumber} onChange={e => setForm({ ...form, contactNumber: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">License Number</label><input className="form-input" value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">License Category</label>
                <select className="form-select" value={form.licenseCategory} onChange={e => setForm({ ...form, licenseCategory: e.target.value })}><option>LMV</option><option>HMV</option></select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">License Expiry Date</label><input className="form-input" type="date" max="2099-12-31" value={form.licenseExpiryDate} onChange={e => setForm({ ...form, licenseExpiryDate: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Safety Score</label><input className="form-input" type="number" min="0" max="100" value={form.safetyScore} onChange={e => setForm({ ...form, safetyScore: +e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as DriverStatus })}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
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
