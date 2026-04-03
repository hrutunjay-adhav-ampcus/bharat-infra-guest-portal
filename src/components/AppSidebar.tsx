import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import {
  LayoutDashboard, Building2, Users, Grid3X3, ClipboardCheck,
  BarChart3, Settings, LogOut, BedDouble, CalendarPlus, BookOpen,
  Wrench, ChevronDown
} from 'lucide-react';
import { useState } from 'react';

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/guest-houses', label: 'Guest Houses', icon: Building2 },
  { to: '/admin/managers', label: 'Managers', icon: Users },
  { to: '/admin/room-layout-builder', label: 'Room Layout Builder', icon: Grid3X3 },
  { to: '/admin/pending-approvals', label: 'Pending Approvals', icon: ClipboardCheck },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

const managerLinks = [
  { to: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/manager/room-grid', label: 'Room Grid', icon: BedDouble },
  { to: '/manager/new-booking', label: 'New Booking', icon: CalendarPlus },
  { to: '/manager/bookings', label: 'Bookings', icon: BookOpen },
  { to: '/manager/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/manager/reports', label: 'Reports', icon: BarChart3 },
];

export default function AppSidebar() {
  const { user, logout, guestHouses, managers, selectedGHId, setSelectedGHId, bookings } = useApp();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const links = isAdmin ? adminLinks : managerLinks;
  const [ghDropdownOpen, setGhDropdownOpen] = useState(false);

  const currentManager = !isAdmin ? managers.find(m => m.id === user?.userId) : null;
  const managerGHs = currentManager ? guestHouses.filter(gh => currentManager.assignedGHs.includes(gh.id)) : [];
  const currentGH = guestHouses.find(gh => gh.id === selectedGHId);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ backgroundColor: '#0f172a' }}>
      <div className="p-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" style={{ color: '#6366f1' }} />
          <span className="font-bold text-sm" style={{ color: 'white' }}>Bharat Infra Corp</span>
        </div>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {isAdmin ? 'Super Admin' : 'Manager Portal'}
        </p>
      </div>

      {!isAdmin && managerGHs.length > 0 && (
        <div className="px-3 py-2 border-b relative" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setGhDropdownOpen(!ghDropdownOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded text-xs"
            style={{ color: 'rgba(255,255,255,0.8)', backgroundColor: 'rgba(255,255,255,0.05)' }}
          >
            <span className="truncate">{currentGH?.name || 'Select Guest House'}</span>
            <ChevronDown className="h-3 w-3 shrink-0" />
          </button>
          {ghDropdownOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-md shadow-lg" style={{ backgroundColor: '#1e293b' }}>
              {managerGHs.map(gh => (
                <button
                  key={gh.id}
                  onClick={() => { setSelectedGHId(gh.id); setGhDropdownOpen(false); }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors"
                  style={{ color: gh.id === selectedGHId ? '#6366f1' : 'rgba(255,255,255,0.8)' }}
                >
                  {gh.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav className="flex-1 py-2">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive ? 'border-l-4 font-medium' : 'border-l-4 border-transparent'
              }`
            }
            style={({ isActive }) => ({
              color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
              backgroundColor: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
              borderLeftColor: isActive ? '#6366f1' : 'transparent',
            })}
          >
            <link.icon className="h-4 w-4" />
            <span>{link.label}</span>
            {link.label === 'Pending Approvals' && pendingCount > 0 && (
              <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#ef4444', color: 'white' }}>
                {pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="text-xs mb-2 px-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {isAdmin ? 'Administrator' : currentManager?.name}
        </div>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded hover:bg-white/10 transition-colors"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
