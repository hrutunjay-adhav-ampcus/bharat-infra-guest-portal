import { useApp } from '@/context/AppContext';
import { BookingStatusBadge } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function AdminPendingApprovals() {
  const { bookings, setBookings, rooms, setRooms, guestHouses, managers } = useApp();
  const [filter, setFilter] = useState<'all' | 'expiring'>('all');
  const [rejectModal, setRejectModal] = useState<{ ref: string; guestIdx: number } | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});

  // CHANGE 4B: Date range filter
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const filterApplied = filter === 'expiring'
    ? pendingBookings.filter(b => b.pendingExpiresAt && (b.pendingExpiresAt - Date.now()) < 3600000)
    : pendingBookings;

  // Date range filter
  const dateFiltered = filterApplied.filter(b => {
    if (!fromDate && !toDate) return true;
    const checkinDate = b.checkin.split('T')[0];
    if (fromDate && checkinDate < fromDate) return false;
    if (toDate && checkinDate > toDate) return false;
    return true;
  });

  // CHANGE 4A: Flatten to per-guest cards
  const guestCards = dateFiltered.flatMap(booking =>
    booking.guests.map((guest, guestIdx) => ({ booking, guest, guestIdx }))
  );

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

  const approveGuest = (ref: string, guestIdx: number) => {
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return;
    const guest = booking.guests[guestIdx];

    if (guest.allocatedRoom && guest.allocatedSection) {
      setRooms(prev => prev.map(room => room.id === guest.allocatedRoom ? {
        ...room,
        sections: room.sections.map(s => s.sectionId === guest.allocatedSection ? { ...s, status: 'booked' as const } : s)
      } : room));
    }

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

    const updatedGuests = booking.guests.filter((_, i) => i !== guestIdx);
    if (updatedGuests.length === 0) {
      setBookings(prev => prev.map(b => b.ref === ref ? { ...b, status: 'rejected' as const, rejectionReason: rejectReason, guests: [] } : b));
    } else {
      setBookings(prev => prev.map(b => b.ref === ref ? { ...b, guests: updatedGuests } : b));
    }

    toast.success('Rejection notification sent to manager');
    setRejectModal(null);
    setRejectReason('');
  };

  const clearDateFilter = () => { setFromDate(''); setToDate(''); };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Pending Approvals</h1>

      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {(['all', 'expiring'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}
            >
              {f === 'all' ? 'All Pending' : 'Expiring Soon (<1hr)'}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="border border-border rounded-md px-3 py-1.5 text-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <input type="date" className="border border-border rounded-md px-3 py-1.5 text-sm" value={toDate} onChange={e => setToDate(e.target.value)} />
          {(fromDate || toDate) && (
            <button onClick={clearDateFilter} className="text-xs text-primary hover:underline">Clear</button>
          )}
        </div>
      </div>

      {guestCards.length === 0 ? (
        <div className="bg-card rounded-[10px] border border-border p-8 text-center text-muted-foreground">No pending approvals</div>
      ) : (
        <div className="space-y-4">
          {guestCards.map(({ booking, guest, guestIdx }) => {
            const gh = guestHouses.find(g => g.id === booking.ghId);
            const mgr = managers.find(m => m.id === gh?.managerId);
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
                    <p className="text-sm text-muted-foreground">{booking.ref} · {gh?.name} · Manager: {mgr?.name}</p>
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    Expires in {countdown}
                  </span>
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

                {booking.pickup.enabled && <div className="text-sm mb-1">🚗 Pickup: {booking.pickup.location} at {booking.pickup.time}</div>}
                {booking.drop.enabled && <div className="text-sm mb-3">🚗 Drop: {booking.drop.location} at {booking.drop.time}</div>}

                <div className="flex gap-2">
                  <Button onClick={() => approveGuest(booking.ref, guestIdx)} style={{ backgroundColor: '#22c55e' }} className="gap-1"><Check className="h-4 w-4" /> Approve</Button>
                  <Button onClick={() => { setRejectModal({ ref: booking.ref, guestIdx }); setRejectReason(''); }} variant="outline" className="gap-1" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-[10px] p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Reject Guest</h3>
            <label className="text-sm font-medium">Rejection Reason (min 10 chars)</label>
            <textarea
              className="w-full mt-2 border border-border rounded-md p-2 text-sm min-h-[100px]"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={rejectGuest} disabled={rejectReason.length < 10} style={{ backgroundColor: '#ef4444', color: 'white' }}>Confirm</Button>
              <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
