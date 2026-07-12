import { useState, useEffect, useCallback } from 'react';
import './index.css';
import { seedIfEmpty, login as doLogin, hasAccess, getSettings } from './lib/store';
import type { User, UserRole, ViewName, Settings } from './types';
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Settings as SettingsIcon, Bell, LogOut
} from 'lucide-react';

import LoginScreen from './screens/Login';
import DashboardScreen from './screens/Dashboard';
import VehiclesScreen from './screens/Vehicles';
import DriversScreen from './screens/Drivers';
import TripsScreen from './screens/Trips';
import MaintenanceScreen from './screens/Maintenance';
import FuelScreen from './screens/Fuel';
import ReportsScreen from './screens/Reports';
import SettingsScreen from './screens/SettingsPage';

seedIfEmpty();

interface NavItem { id: ViewName; label: string; icon: React.ReactNode; module: string; }

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard />, module: '_always' },
  { id: 'vehicles', label: 'Vehicle Registry', icon: <Truck />, module: 'Fleet' },
  { id: 'drivers', label: 'Drivers & Safety', icon: <Users />, module: 'Drivers' },
  { id: 'trips', label: 'Trip Dispatcher', icon: <Route />, module: 'Trips' },
  { id: 'maintenance', label: 'Maintenance', icon: <Wrench />, module: 'Fleet' },
  { id: 'fuel', label: 'Fuel & Expenses', icon: <Fuel />, module: 'Fuel-Exp' },
  { id: 'reports', label: 'Reports & Analytics', icon: <BarChart3 />, module: 'Analytics' },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon />, module: 'Settings' },
];

const VIEW_LABELS: Record<ViewName, string> = {
  login: 'Login', dashboard: 'Dashboard', vehicles: 'Vehicle Registry',
  drivers: 'Drivers & Safety Profiles', trips: 'Trip Dispatcher',
  maintenance: 'Maintenance', fuel: 'Fuel & Expense Management',
  reports: 'Reports & Analytics', settings: 'Settings & RBAC',
};

const ROLES: UserRole[] = ['Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewName>('login');
  const [settings, setSettings] = useState<Settings>({ depotName: 'TransitOps Main Depot', currency: '₹', distanceUnit: 'km' });
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const notifications = [
    { id: 1, text: 'Vehicle MH12EF3333 requires maintenance', time: '5m ago' },
    { id: 2, text: 'Trip to Pune completed successfully', time: '1h ago' },
    { id: 3, text: 'Driver Suresh Kumar license expiring soon', time: '2h ago' },
  ];

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const filteredNav = useCallback(() => {
    if (!user) return [];
    return NAV_ITEMS.filter(n => n.module === '_always' || hasAccess(user.role, n.module) !== 'none');
  }, [user]);

  const handleLogin = async (email: string, password: string) => {
    const u = await doLogin(email, password);
    setUser(u);
    setView('dashboard');
  };

  const handleRoleSwitch = (role: UserRole) => {
    if (user) {
      const newUser = { ...user, role };
      setUser(newUser);
      const nav = NAV_ITEMS.filter(n => n.module === '_always' || hasAccess(role, n.module) !== 'none');
      if (!nav.find(n => n.id === view)) setView('dashboard');
    }
  };

  const handleLogout = () => { setUser(null); setView('login'); };

  if (!user || view === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (view) {
      case 'dashboard': return <DashboardScreen settings={settings} />;
      case 'vehicles': return <VehiclesScreen settings={settings} />;
      case 'drivers': return <DriversScreen role={user.role} />;
      case 'trips': return <TripsScreen settings={settings} readOnly={hasAccess(user.role, 'Trips') === 'view'} />;
      case 'maintenance': return <MaintenanceScreen settings={settings} />;
      case 'fuel': return <FuelScreen settings={settings} />;
      case 'reports': return <ReportsScreen settings={settings} />;
      case 'settings': return <SettingsScreen settings={settings} onUpdate={setSettings} />;
      default: return <DashboardScreen settings={settings} />;
    }
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>TransitOps</h2>
          <span>Smart Transport Operations</span>
        </div>
        <nav className="sidebar-nav">
          {filteredNav().map(item => (
            <button key={item.id} className={`sidebar-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">TRANSITOPS © 2026</div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <span className="breadcrumb">TransitOps › <strong>{VIEW_LABELS[view]}</strong></span>
            <input className="topbar-search" placeholder="🔍 Search..." />
          </div>
          <div className="topbar-right">
            <div style={{ position: 'relative' }}>
              <button className="topbar-bell" onClick={() => { setShowNotifications(!showNotifications); setHasUnread(false); }}>
                <Bell />
                {hasUnread && notifications.length > 0 && <span className="bell-badge">{notifications.length}</span>}
              </button>
              
              {showNotifications && (
                <>
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }} 
                    onClick={() => setShowNotifications(false)} 
                  />
                  <div className="notification-dropdown" style={{ zIndex: 50 }}>
                    <div className="notification-header">Notifications ({notifications.length})</div>
                    {notifications.map(n => (
                      <div key={n.id} className="notification-item">
                        <p>{n.text}</p>
                        <span>{n.time}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <select className="role-switcher" value={user.role} onChange={e => handleRoleSwitch(e.target.value as UserRole)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={handleLogout}><LogOut size={14} /> Logout</button>
          </div>
        </header>
        <main className="content">{renderView()}</main>
      </div>
    </div>
  );
}
