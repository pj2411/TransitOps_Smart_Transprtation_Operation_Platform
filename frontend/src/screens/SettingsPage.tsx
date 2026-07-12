import { useState, useEffect } from 'react';
import { getSettings, updateSettings, getRolePermissions } from '../lib/store';
import type { Settings, RolePermission, UserRole, Module } from '../types';
import { Save } from 'lucide-react';

const ROLES: UserRole[] = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];
const MODULES: Module[] = ['Fleet', 'Drivers', 'Trips', 'Fuel-Exp', 'Analytics', 'Settings'];
const accessColor: Record<string, string> = { full: 'badge-green', view: 'badge-blue', none: 'badge-gray' };

export default function SettingsPage({ settings, onUpdate }: { settings: Settings; onUpdate: (s: Settings) => void }) {
  const [form, setForm] = useState(settings);
  const [perms, setPerms] = useState<RolePermission[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => { getRolePermissions().then(setPerms); }, []);
  useEffect(() => { setForm(settings); }, [settings]);

  const handleSave = async () => {
    const s = await updateSettings(form);
    onUpdate(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getAccess = (role: UserRole, mod: Module) => {
    const p = perms.find(x => x.role === role && x.module === mod);
    return p?.access || 'none';
  };

  return (
    <div>
      <div className="panel mb-16">
        <div className="panel-header"><h3>General Depot Settings</h3></div>
        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="form-group">
            <label className="form-label">Depot Name</label>
            <input className="form-input" value={form.depotName} onChange={e => setForm({ ...form, depotName: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <input className="form-input" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} placeholder="₹" />
          </div>
          <div className="form-group">
            <label className="form-label">Distance Unit</label>
            <select className="form-select" value={form.distanceUnit} onChange={e => setForm({ ...form, distanceUnit: e.target.value })}>
              <option>km</option><option>mi</option>
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={handleSave}><Save size={14} /> Save Settings</button>
          {saved && <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>✓ Saved</span>}
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h3>Access Permissions (RBAC)</h3></div>
        <table className="rbac-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Role</th>
              {MODULES.map(m => <th key={m}>{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROLES.map(role => (
              <tr key={role}>
                <td style={{ textAlign: 'left', color: 'var(--text-main)', fontWeight: 500, fontSize: 13 }}>{role}</td>
                {MODULES.map(mod => {
                  const access = getAccess(role, mod);
                  return (
                    <td key={mod}>
                      <span className={`rbac-cell badge ${accessColor[access]}`}>{access}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="rule-note mt-16">
          If a role has "none" on a module, the sidebar link is completely hidden — not rendered as "Access Denied".
        </div>
      </div>
    </div>
  );
}
