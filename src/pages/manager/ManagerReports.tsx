import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import { BookingStatusBadge, CategoryBadge, PriorityBadge } from '@/components/StatusBadges';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Calendar, BedDouble, Wrench, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6'];

export default function ManagerReports() {
  const { selectedGHId, rooms, bookings, tickets, guestHouses } = useApp();
  const [tab, setTab] = useState<'booking' | 'occupancy' | 'maintenance' | 'summary'>('booking');
  const tabs = ['booking', 'occupancy', 'maintenance', 'summary'] as const;

  const ghRooms = rooms.filter(r => r.ghId === selectedGHId);
  const ghBookings = bookings.filter(b => b.ghId === selectedGHId);
  const ghTickets = tickets.filter(t => t.ghId === selectedGHId);
  const gh = guestHouses.find(g => g.id === selectedGHId);

  const download = (type: string) => toast.success(`${type} report downloaded`);

  const totalGuestNights = ghBookings.reduce((a, b) => a + b.nights * b.guests.length, 0);
  const uniqueGuests = new Set(ghBookings.flatMap(b => b.guests.map(g => g.name))).size;

  const categories = Array.from(new Set(ghTickets.map(t => t.category)));
  const maintenanceByCategory = categories.map(cat => ({ name: cat, value: ghTickets.filter(t => t.category === cat).length }));

  const avgResolution = (() => {
    const resolved = ghTickets.filter(t => t.resolutionHours);
    return resolved.length > 0 ? Math.round(resolved.reduce((a, t) => a + (t.resolutionHours || 0), 0) / resolved.length) : 0;
  })();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Reports</h1>
      <p className="text-sm text-muted-foreground mb-6">{gh?.name}</p>

      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
            {t === 'booking' ? 'Booking Report' : t === 'occupancy' ? 'Occupancy Report' : t === 'maintenance' ? 'Maintenance Report' : 'Summary'}
          </button>
        ))}
      </div>

      {tab === 'booking' && (
        <div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard title="Total Bookings" value={ghBookings.length} icon={Calendar} color="#6366f1" />
            <StatCard title="Total Guest Nights" value={totalGuestNights} icon={BedDouble} color="#22c55e" />
            <StatCard title="Unique Guests" value={uniqueGuests} icon={Calendar} color="#3b82f6" />
          </div>
          <div className="bg-card rounded-[10px] border border-border overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr>
                <th className="text-left px-4 py-3">Ref</th><th className="text-left px-4 py-3">Guests</th>
                <th className="text-left px-4 py-3">Rooms</th><th className="text-left px-4 py-3">Check-in</th>
                <th className="text-left px-4 py-3">Check-out</th><th className="text-left px-4 py-3">Nights</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr></thead>
              <tbody>
                {ghBookings.map(b => (
                  <tr key={b.ref} className="border-t border-border">
                    <td className="px-4 py-2">{b.ref}</td>
                    <td className="px-4 py-2">{b.guests.map(g => g.name).join(', ')}</td>
                    <td className="px-4 py-2">{b.guests.map(g => `${rooms.find(r => r.id === g.allocatedRoom)?.number || '?'}-${g.allocatedSection}`).join(', ')}</td>
                    <td className="px-4 py-2">{new Date(b.checkin).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{new Date(b.checkout).toLocaleDateString()}</td>
                    <td className="px-4 py-2">{b.nights}</td>
                    <td className="px-4 py-2"><BookingStatusBadge status={b.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => download('Excel')} className="gap-1"><Download className="h-4 w-4" /> Download Excel</Button>
            <Button variant="outline" onClick={() => download('PDF')} className="gap-1"><Download className="h-4 w-4" /> Download PDF</Button>
          </div>
        </div>
      )}

      {tab === 'occupancy' && (
        <div>
          <div className="bg-card rounded-[10px] border border-border p-5 mb-4">
            <h3 className="font-semibold mb-4">Occupancy by Section</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ghRooms.map(r => {
                const occ = r.sections.filter(s => s.status === 'occupied').length;
                return { name: r.number, occupancy: Math.round((occ / r.sections.length) * 100) };
              })}>
                <XAxis dataKey="name" /><YAxis /><Tooltip />
                <Bar dataKey="occupancy" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-[10px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr>
                <th className="text-left px-4 py-3">Room</th><th className="text-left px-4 py-3">BHK</th><th className="text-left px-4 py-3">Floor</th>
                <th className="text-left px-4 py-3">Occupied</th><th className="text-left px-4 py-3">Available</th><th className="text-left px-4 py-3">Occ %</th>
              </tr></thead>
              <tbody>
                {ghRooms.map(r => {
                  const occ = r.sections.filter(s => s.status === 'occupied').length;
                  const avail = r.sections.filter(s => s.status === 'available').length;
                  return (
                    <tr key={r.id} className="border-t border-border">
                      <td className="px-4 py-2">{r.number}</td><td className="px-4 py-2">{r.bhkCount}</td><td className="px-4 py-2">{r.floor}</td>
                      <td className="px-4 py-2">{occ}</td><td className="px-4 py-2">{avail}</td>
                      <td className="px-4 py-2">{Math.round((occ / r.sections.length) * 100)}%</td>
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
          <div className="grid grid-cols-3 gap-4 mb-6">
            <StatCard title="Total Tickets" value={ghTickets.length} icon={Wrench} color="#6366f1" />
            <StatCard title="Avg Resolution (hrs)" value={avgResolution} icon={Wrench} color="#22c55e" />
            <StatCard title="Open Issues" value={ghTickets.filter(t => t.status !== 'resolved').length} icon={Wrench} color="#ef4444" />
          </div>
          <div className="bg-card rounded-[10px] border border-border p-5 mb-4">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={maintenanceByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {maintenanceByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend /><Tooltip />
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
                {ghTickets.map(t => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="px-4 py-2">{rooms.find(r => r.id === t.roomId)?.number}-{t.sectionId}</td>
                    <td className="px-4 py-2"><CategoryBadge category={t.category} /></td>
                    <td className="px-4 py-2"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-2">{t.reportedAt}</td><td className="px-4 py-2">{t.resolvedAt || '-'}</td>
                    <td className="px-4 py-2">{t.resolutionHours || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'summary' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <StatCard title="Total Bookings" value={ghBookings.length} icon={Calendar} color="#6366f1" />
            <StatCard title="Guest Nights" value={totalGuestNights} icon={BedDouble} color="#22c55e" />
            <StatCard title="Tickets" value={ghTickets.length} icon={Wrench} color="#f59e0b" />
          </div>
          <Button variant="outline" onClick={() => download('Full Report PDF')} className="gap-1"><Download className="h-4 w-4" /> Download Full Report</Button>
        </div>
      )}
    </div>
  );
}
