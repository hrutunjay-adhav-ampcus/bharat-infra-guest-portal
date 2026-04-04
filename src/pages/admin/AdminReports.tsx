import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import { BookingStatusBadge, CategoryBadge, PriorityBadge } from '@/components/StatusBadges';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3, Calendar, Wrench, BedDouble, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import SortDropdown, { sortData } from '@/components/SortDropdown';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6'];

export default function AdminReports() {
  const { guestHouses, rooms, bookings, tickets } = useApp();
  const [tab, setTab] = useState<'overview' | 'occupancy' | 'maintenance' | 'bookings'>('overview');
  const [sort, setSort] = useState('date_desc');
  const tabs = ['overview', 'occupancy', 'maintenance', 'bookings'] as const;

  const download = (type: string) => toast.success(`${type} report downloaded`);

  const bookingsPerGH = guestHouses.map(gh => ({
    name: gh.name.split(' ')[0],
    bookings: bookings.filter(b => b.ghId === gh.id).length,
  }));

  const categories = Array.from(new Set(tickets.map(t => t.category)));
  const maintenanceByCategory = categories.map(cat => ({
    name: cat,
    value: tickets.filter(t => t.category === cat).length,
  }));

  const sortedBookings = sortData(bookings, sort);
  const sortedTickets = sortData(tickets, sort);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reports</h1>

      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
              {t}
            </button>
          ))}
        </div>
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {tab === 'overview' && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard title="Total Bookings" value={bookings.length} icon={Calendar} color="#6366f1" />
            <StatCard title="Active Bookings" value={bookings.filter(b => ['confirmed', 'checked_in'].includes(b.status)).length} icon={BarChart3} color="#22c55e" />
            <StatCard title="Total Rooms" value={rooms.length} icon={BedDouble} color="#3b82f6" />
            <StatCard title="Maintenance Tickets" value={tickets.length} icon={Wrench} color="#f59e0b" />
          </div>
          <div className="bg-card rounded-[10px] border border-border p-5">
            <h3 className="font-semibold mb-4">Bookings per Guest House</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bookingsPerGH}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => download('Excel')} className="gap-1"><Download className="h-4 w-4" /> Download Excel</Button>
            <Button variant="outline" onClick={() => download('PDF')} className="gap-1"><Download className="h-4 w-4" /> Download PDF</Button>
          </div>
        </div>
      )}

      {tab === 'occupancy' && (
        <div>
          <div className="bg-card rounded-[10px] border border-border p-5 mb-4">
            <h3 className="font-semibold mb-4">Occupancy by Room</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={rooms.filter(r => r.ghId === 'gh1').map(r => {
                const total = r.sections.length;
                const occ = r.sections.filter(s => s.status === 'occupied').length;
                return { name: r.number, occupancy: Math.round((occ / total) * 100) };
              })}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="occupancy" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-[10px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr>
                <th className="text-left px-4 py-3">GH</th><th className="text-left px-4 py-3">Room</th><th className="text-left px-4 py-3">BHK</th>
                <th className="text-left px-4 py-3">Occupied</th><th className="text-left px-4 py-3">Available</th><th className="text-left px-4 py-3">Occ %</th>
              </tr></thead>
              <tbody>
                {rooms.map(r => {
                  const gh = guestHouses.find(g => g.id === r.ghId);
                  const occ = r.sections.filter(s => s.status === 'occupied').length;
                  const avail = r.sections.filter(s => s.status === 'available').length;
                  const pct = r.sections.length > 0 ? Math.round((occ / r.sections.length) * 100) : 0;
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-2">{gh?.name}</td><td className="px-4 py-2">{r.number}</td><td className="px-4 py-2">{r.bhkCount}</td>
                      <td className="px-4 py-2">{occ}</td><td className="px-4 py-2">{avail}</td><td className="px-4 py-2">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'maintenance' && (
        <div>
          <div className="bg-card rounded-[10px] border border-border p-5 mb-4">
            <h3 className="font-semibold mb-4">Tickets by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={maintenanceByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {maintenanceByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-[10px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr>
                <th className="text-left px-4 py-3">Room</th><th className="text-left px-4 py-3">Category</th><th className="text-left px-4 py-3">Priority</th>
                <th className="text-left px-4 py-3">Reported</th><th className="text-left px-4 py-3">Resolved</th><th className="text-left px-4 py-3">Hours</th>
              </tr></thead>
              <tbody>
                {sortedTickets.map(t => {
                  const room = rooms.find(r => r.id === t.roomId);
                  return (
                    <tr key={t.id} className="border-t border-border">
                      <td className="px-4 py-2">{room?.number || '-'}-{t.sectionId}</td>
                      <td className="px-4 py-2"><CategoryBadge category={t.category} /></td>
                      <td className="px-4 py-2"><PriorityBadge priority={t.priority} /></td>
                      <td className="px-4 py-2">{t.reportedAt}</td>
                      <td className="px-4 py-2">{t.resolvedAt || '-'}</td>
                      <td className="px-4 py-2">{t.resolutionHours || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'bookings' && (
        <div className="bg-card rounded-[10px] border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr>
              <th className="text-left px-4 py-3">Ref</th><th className="text-left px-4 py-3">GH</th>
              <th className="text-left px-4 py-3">Guests</th><th className="text-left px-4 py-3">Rooms</th>
              <th className="text-left px-4 py-3">Check-in</th><th className="text-left px-4 py-3">Check-out</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr></thead>
            <tbody>
              {sortedBookings.map(b => {
                const gh = guestHouses.find(g => g.id === b.ghId);
                return (
                  <tr key={b.ref} className="border-t border-border">
                    <td className="px-4 py-2 font-medium">{b.ref}</td>
                    <td className="px-4 py-2">{gh?.name}</td>
                    <td className="px-4 py-2">{b.guests.map(g => g.name).join(', ')}</td>
                    <td className="px-4 py-2">{b.guests.map(g => `${rooms.find(r => r.id === g.allocatedRoom)?.number || '?'}-${g.allocatedSection}`).join(', ')}</td>
                    <td className="px-4 py-2">{new Date(b.checkin).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{new Date(b.checkout).toLocaleDateString()}</td>
                    <td className="px-4 py-2"><BookingStatusBadge status={b.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
