import { useApp } from '@/context/AppContext';
import { BookingStatusBadge } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import SortDropdown, { sortData } from '@/components/SortDropdown';

export default function AdminPendingApprovals() {
  const { bookings, setBookings, rooms, setRooms, guestHouses, managers } = useApp();
  const [filter, setFilter] = useState<'all' | 'expiring' | 'alltime'>('all');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [sort, setSort] = useState('date_desc');

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const filterApplied = filter === 'expiring'
    ? pendingBookings.filter(b => b.pendingExpiresAt && (b.pendingExpiresAt - Date.now()) < 3600000)
    : pendingBookings;
  const filtered = sortData(filterApplied, sort);

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

  const approve = (ref: string) => {
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

  const reject = () => {
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
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-card rounded-[10px] border border-border p-8 text-center text-muted-foreground">No pending approvals</div>
      ) : (
        <div className="space-y-4">
          {filtered.map(booking => {
            const gh = guestHouses.find(g => g.id === booking.ghId);
            const mgr = managers.find(m => m.id === gh?.managerId);
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
                    <p className="text-sm text-muted-foreground">{gh?.name} · Manager: {mgr?.name}</p>
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${isExpiringSoon ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    Expires in {countdown}
                  </span>
                </div>

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

                <div className="text-sm text-muted-foreground mb-3">
                  Check-in: {new Date(booking.checkin).toLocaleDateString()} → Check-out: {new Date(booking.checkout).toLocaleDateString()} ({booking.nights} nights) · Purpose: {booking.purpose}
                </div>

                {booking.pickup.enabled && <div className="text-sm mb-1">🚗 Pickup: {booking.pickup.location} at {booking.pickup.time}</div>}
                {booking.drop.enabled && <div className="text-sm mb-3">🚗 Drop: {booking.drop.location} at {booking.drop.time}</div>}

                <div className="flex gap-2">
                  <Button onClick={() => approve(booking.ref)} style={{ backgroundColor: '#22c55e' }} className="gap-1"><Check className="h-4 w-4" /> Approve</Button>
                  <Button onClick={() => { setRejectModal(booking.ref); setRejectReason(''); }} variant="outline" className="gap-1" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
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
            <h3 className="font-semibold mb-4">Reject Booking {rejectModal}</h3>
            <label className="text-sm font-medium">Rejection Reason (min 10 chars)</label>
            <textarea
              className="w-full mt-2 border border-border rounded-md p-2 text-sm min-h-[100px]"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 mt-4">
              <Button onClick={reject} disabled={rejectReason.length < 10} style={{ backgroundColor: '#ef4444', color: 'white' }}>Confirm</Button>
              <Button variant="outline" onClick={() => setRejectModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
