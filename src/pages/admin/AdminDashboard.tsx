import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import { BookingStatusBadge } from '@/components/StatusBadges';
import { Building2, Users, BedDouble, ClipboardCheck, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import SortDropdown, { sortData } from '@/components/SortDropdown';

export default function AdminDashboard() {
  const { guestHouses, managers, rooms, bookings, setBookings, setRooms } = useApp();
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const totalRooms = rooms.length;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [sort, setSort] = useState('date_desc');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cd: Record<string, string> = {};
      pendingBookings.forEach(b => {
        if (b.pendingExpiresAt) {
          const diff = b.pendingExpiresAt - now;
          if (diff > 0) {
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            cd[b.ref] = `${h}h ${m}m ${s}s`;
          } else {
            cd[b.ref] = 'Expired';
          }
        }
      });
      setCountdowns(cd);
    }, 1000);
    return () => clearInterval(interval);
  }, [pendingBookings]);

  const approveBooking = (ref: string) => {
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === ref ? { ...b, status: 'confirmed' as const, emailSent: true } : b));
    setRooms(prev => prev.map(room => ({
      ...room,
      sections: room.sections.map(s => {
        const isAllocated = booking.guests.some(g => g.allocatedRoom === room.id && g.allocatedSection === s.sectionId);
        if (isAllocated) return { ...s, status: 'booked' as const };
        return s;
      })
    })));
    const emails = booking.guests.map(g => g.email).join(', ');
    toast('Sending confirmation emails...');
    setTimeout(() => toast.success(`✓ Confirmation emails sent to ${emails}`), 1500);
  };

  const rejectBooking = () => {
    if (!rejectModal || rejectReason.length < 10) return;
    const booking = bookings.find(b => b.ref === rejectModal);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === rejectModal ? { ...b, status: 'rejected' as const, rejectionReason: rejectReason } : b));
    setRooms(prev => prev.map(room => ({
      ...room,
      sections: room.sections.map(s => {
        const isAllocated = booking.guests.some(g => g.allocatedRoom === room.id && g.allocatedSection === s.sectionId);
        if (isAllocated && (s.status === 'pending_approval' || s.status === 'booked')) {
          return { ...s, status: 'available' as const, guestName: null, bookingRef: null };
        }
        return s;
      })
    })));
    toast.success('Rejection notification sent to manager');
    setRejectModal(null);
    setRejectReason('');
  };

  const getGHManager = (ghId: string) => {
    const gh = guestHouses.find(g => g.id === ghId);
    return managers.find(m => m.id === gh?.managerId);
  };

  const sortedPending = sortData(pendingBookings, sort);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Total Guest Houses" value={guestHouses.length} icon={Building2} color="#0f172a" />
        <StatCard title="Total Managers" value={managers.length} icon={Users} color="#6366f1" />
        <StatCard title="Total Rooms" value={totalRooms} icon={BedDouble} color="#22c55e" />
        <StatCard title="Pending Approvals" value={pendingBookings.length} icon={ClipboardCheck} color="#f59e0b" badge={pendingBookings.length} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Pending Booking Requests</h2>
        <SortDropdown value={sort} onChange={setSort} />
      </div>
      {sortedPending.length === 0 ? (
        <div className="bg-card rounded-[10px] border border-border p-8 text-center text-muted-foreground">No pending requests</div>
      ) : (
        <div className="space-y-4 mb-8">
          {sortedPending.map(booking => {
            const mgr = getGHManager(booking.ghId);
            const gh = guestHouses.find(g => g.id === booking.ghId);
            const countdown = countdowns[booking.ref] || '';
            const isExpiringSoon = booking.pendingExpiresAt && (booking.pendingExpiresAt - Date.now()) < 30 * 60 * 1000;

            return (
              <div key={booking.ref} className="bg-card rounded-[10px] border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{booking.ref}</span>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{gh?.name} · Manager: {mgr?.name}</p>
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    Expires in {countdown}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div><span className="text-muted-foreground">Guests:</span> {booking.guests.length}</div>
                  <div><span className="text-muted-foreground">Rooms:</span> {booking.guests.map(g => `${rooms.find(r => r.id === g.allocatedRoom)?.number || '?'}-${g.allocatedSection}`).join(', ')}</div>
                  <div><span className="text-muted-foreground">Purpose:</span> {booking.purpose}</div>
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Check-in: {new Date(booking.checkin).toLocaleDateString()} → Check-out: {new Date(booking.checkout).toLocaleDateString()} ({booking.nights} nights)
                </div>

                {booking.pickup.enabled && (
                  <div className="text-sm mb-1">🚗 Pickup: {booking.pickup.location} at {booking.pickup.time} ({booking.pickup.vehicle})</div>
                )}
                {booking.drop.enabled && (
                  <div className="text-sm mb-3">🚗 Drop: {booking.drop.location} at {booking.drop.time} ({booking.drop.vehicle})</div>
                )}

                <button
                  onClick={() => setExpanded(prev => ({ ...prev, [booking.ref]: !prev[booking.ref] }))}
                  className="text-sm font-medium flex items-center gap-1 mb-3"
                  style={{ color: '#6366f1' }}
                >
                  {expanded[booking.ref] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  View Guest Details
                </button>

                {expanded[booking.ref] && (
                  <div className="border border-border rounded-lg overflow-hidden mb-3">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left px-3 py-2 font-medium">Name</th>
                          <th className="text-left px-3 py-2 font-medium">Phone</th>
                          <th className="text-left px-3 py-2 font-medium">Company</th>
                          <th className="text-left px-3 py-2 font-medium">Type</th>
                          <th className="text-left px-3 py-2 font-medium">Room/Section</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booking.guests.map((g, i) => (
                          <tr key={i} className="border-t border-border">
                            <td className="px-3 py-2">{g.name}</td>
                            <td className="px-3 py-2">{g.phone}</td>
                            <td className="px-3 py-2">{g.company}</td>
                            <td className="px-3 py-2 capitalize">{g.type}</td>
                            <td className="px-3 py-2">{rooms.find(r => r.id === g.allocatedRoom)?.number || '-'}-{g.allocatedSection || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button onClick={() => approveBooking(booking.ref)} className="gap-1" style={{ backgroundColor: '#22c55e' }}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button onClick={() => { setRejectModal(booking.ref); setRejectReason(''); }} variant="outline" className="gap-1" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Guest House Summary</h2>
      <div className="bg-card rounded-[10px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">City</th>
              <th className="text-left px-4 py-3 font-medium">Manager</th>
              <th className="text-left px-4 py-3 font-medium">Rooms</th>
              <th className="text-left px-4 py-3 font-medium">Active Bookings</th>
              <th className="text-left px-4 py-3 font-medium">Occupancy %</th>
            </tr>
          </thead>
          <tbody>
            {guestHouses.map(gh => {
              const ghRooms = rooms.filter(r => r.ghId === gh.id);
              const totalSections = ghRooms.reduce((acc, r) => acc + r.sections.length, 0);
              const occupiedSections = ghRooms.reduce((acc, r) => acc + r.sections.filter(s => s.status === 'occupied').length, 0);
              const occ = totalSections > 0 ? Math.round((occupiedSections / totalSections) * 100) : 0;
              const mgr = managers.find(m => m.id === gh.managerId);
              const activeBookings = bookings.filter(b => b.ghId === gh.id && ['confirmed', 'checked_in', 'pending'].includes(b.status)).length;

              return (
                <tr key={gh.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{gh.name}</td>
                  <td className="px-4 py-3">{gh.city}</td>
                  <td className="px-4 py-3">{mgr?.name || '-'}</td>
                  <td className="px-4 py-3">{ghRooms.length}</td>
                  <td className="px-4 py-3">{activeBookings}</td>
                  <td className="px-4 py-3">{occ}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-[10px] p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Reject Booking {rejectModal}</h3>
            <label className="text-sm font-medium">Rejection Reason (min 10 chars)</label>
            <textarea
              className="w-full mt-2 border border-border rounded-md p-2 text-sm min-h-[100px]"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={rejectBooking} disabled={rejectReason.length < 10} style={{ backgroundColor: '#ef4444', color: 'white' }}>
                Confirm Rejection
              </Button>
              <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
