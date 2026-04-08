import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import { BookingStatusBadge } from '@/components/StatusBadges';
import { Building2, Users, BedDouble, ClipboardCheck, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const { guestHouses, managers, rooms, bookings, setBookings, setRooms } = useApp();
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const totalRooms = rooms.length;
  const [rejectModal, setRejectModal] = useState<{ ref: string; guestIdx: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  // CHANGE 4B: Date range filter instead of sort dropdown
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

  // CHANGE 4B: Filter by date range
  const filteredPending = pendingBookings.filter(b => {
    if (!fromDate && !toDate) return true;
    const checkinDate = b.checkin.split('T')[0];
    if (fromDate && checkinDate < fromDate) return false;
    if (toDate && checkinDate > toDate) return false;
    return true;
  });

  // CHANGE 4A: Flatten to per-guest cards
  const guestCards = filteredPending.flatMap(booking =>
    booking.guests.map((guest, guestIdx) => ({
      booking,
      guest,
      guestIdx,
    }))
  );

  const approveGuest = (ref: string, guestIdx: number) => {
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return;
    const guest = booking.guests[guestIdx];
    if (!guest) return;

    // Mark this guest's section as booked
    if (guest.allocatedRoom && guest.allocatedSection) {
      setRooms(prev => prev.map(room => room.id === guest.allocatedRoom ? {
        ...room,
        sections: room.sections.map(s => s.sectionId === guest.allocatedSection ? { ...s, status: 'booked' as const } : s)
      } : room));
    }

    // Check if all guests in this booking are now approved (sections are booked)
    // We need to check after this approval
    const otherGuests = booking.guests.filter((_, i) => i !== guestIdx);
    const allOthersApproved = otherGuests.every(g => {
      if (!g.allocatedRoom || !g.allocatedSection) return true;
      const room = rooms.find(r => r.id === g.allocatedRoom);
      const section = room?.sections.find(s => s.sectionId === g.allocatedSection);
      return section?.status === 'booked';
    });

    if (allOthersApproved) {
      setBookings(prev => prev.map(b => b.ref === ref ? { ...b, status: 'confirmed' as const, emailSent: true } : b));
      const emails = booking.guests.map(g => g.email).join(', ');
      toast('Sending confirmation emails...');
      setTimeout(() => toast.success(`✓ Confirmation emails sent to ${emails}`), 1500);
    } else {
      toast.success(`Guest ${guest.name} approved`);
    }
  };

  const rejectGuest = () => {
    if (!rejectModal || rejectReason.length < 10) return;
    const { ref, guestIdx } = rejectModal;
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return;
    const guest = booking.guests[guestIdx];

    // Release this guest's section
    if (guest.allocatedRoom && guest.allocatedSection) {
      setRooms(prev => prev.map(room => room.id === guest.allocatedRoom ? {
        ...room,
        sections: room.sections.map(s => {
          if (s.sectionId === guest.allocatedSection && (s.status === 'pending_approval' || s.status === 'booked')) {
            return { ...s, status: 'available' as const, guestName: null, bookingRef: null };
          }
          return s;
        })
      } : room));
    }

    // Remove guest from booking
    const updatedGuests = booking.guests.filter((_, i) => i !== guestIdx);
    if (updatedGuests.length === 0) {
      // All guests rejected
      setBookings(prev => prev.map(b => b.ref === ref ? { ...b, status: 'rejected' as const, rejectionReason: rejectReason, guests: [] } : b));
    } else {
      setBookings(prev => prev.map(b => b.ref === ref ? { ...b, guests: updatedGuests } : b));
    }

    toast.success('Guest rejected. Notification sent to manager');
    setRejectModal(null);
    setRejectReason('');
  };

  const getGHManager = (ghId: string) => {
    const gh = guestHouses.find(g => g.id === ghId);
    return managers.find(m => m.id === gh?.managerId);
  };

  const clearDateFilter = () => {
    setFromDate('');
    setToDate('');
  };

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
        <div className="flex items-center gap-2">
          <input type="date" className="border border-border rounded-md px-3 py-1.5 text-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} placeholder="From" />
          <input type="date" className="border border-border rounded-md px-3 py-1.5 text-sm" value={toDate} onChange={e => setToDate(e.target.value)} placeholder="To" />
          <Button size="sm" onClick={() => {}} variant="outline" disabled={!fromDate && !toDate}>Apply Filter</Button>
          {(fromDate || toDate) && (
            <button onClick={clearDateFilter} className="text-xs text-primary hover:underline">Clear</button>
          )}
        </div>
      </div>

      {guestCards.length === 0 ? (
        <div className="bg-card rounded-[10px] border border-border p-8 text-center text-muted-foreground">No pending requests</div>
      ) : (
        <div className="space-y-4 mb-8">
          {guestCards.map(({ booking, guest, guestIdx }) => {
            const mgr = getGHManager(booking.ghId);
            const gh = guestHouses.find(g => g.id === booking.ghId);
            const countdown = countdowns[booking.ref] || '';
            const isExpiringSoon = booking.pendingExpiresAt && (booking.pendingExpiresAt - Date.now()) < 30 * 60 * 1000;
            const room = rooms.find(r => r.id === guest.allocatedRoom);

            return (
              <div key={`${booking.ref}-${guestIdx}`} className="bg-card rounded-[10px] border border-border p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{guest.name}</span>
                      <BookingStatusBadge status={booking.status} />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {booking.ref} · {gh?.name} · Manager: {mgr?.name}
                    </p>
                  </div>
                  <div className={`text-sm font-medium px-3 py-1 rounded-full ${isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    Expires in {countdown}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                  <div><span className="text-muted-foreground">Phone:</span> {guest.phone}</div>
                  <div><span className="text-muted-foreground">Company:</span> {guest.company}</div>
                  <div><span className="text-muted-foreground">Type:</span> <span className="capitalize">{guest.type}</span></div>
                  <div><span className="text-muted-foreground">Room:</span> {room?.number || '—'}-{guest.allocatedSection || '—'}</div>
                </div>

                <div className="text-sm text-muted-foreground mb-3">
                  Check-in: {new Date(booking.checkin).toLocaleDateString()} → Check-out: {new Date(booking.checkout).toLocaleDateString()} ({booking.nights} nights) · Purpose: {booking.purpose}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => approveGuest(booking.ref, guestIdx)} className="gap-1" style={{ backgroundColor: '#22c55e' }}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button onClick={() => { setRejectModal({ ref: booking.ref, guestIdx }); setRejectReason(''); }} variant="outline" className="gap-1" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
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
            <h3 className="font-semibold mb-4">Reject Guest</h3>
            <label className="text-sm font-medium">Rejection Reason (min 10 chars)</label>
            <textarea
              className="w-full mt-2 border border-border rounded-md p-2 text-sm min-h-[100px]"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={rejectGuest} disabled={rejectReason.length < 10} style={{ backgroundColor: '#ef4444', color: 'white' }}>
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
