import { useApp } from '@/context/AppContext';
import { BookingStatusBadge } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Eye, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TABS = ['all', 'pending', 'confirmed', 'checked_in', 'completed', 'rejected', 'cancelled'] as const;

export default function ManagerBookings() {
  const { selectedGHId, bookings, setBookings, rooms, setRooms, setTickets, guestHouses, managers, settings } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const [previewOpenForRef, setPreviewOpenForRef] = useState<string | null>(null);

  const ghBookings = bookings.filter(b => b.ghId === selectedGHId);
  const filtered = ghBookings
    .filter(b => tab === 'all' || b.status === tab)
    .filter(b => !search || b.ref.toLowerCase().includes(search.toLowerCase()) || b.guests.some(g => g.name.toLowerCase().includes(search.toLowerCase())));

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const cd: Record<string, string> = {};
      ghBookings.filter(b => b.status === 'pending' && b.pendingExpiresAt).forEach(b => {
        const diff = b.pendingExpiresAt! - now;
        if (diff > 0) {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          cd[b.ref] = `${h}h ${m}m`;
        } else {
          cd[b.ref] = 'Expired';
        }
      });
      setCountdowns(cd);
    }, 1000);
    return () => clearInterval(interval);
  }, [ghBookings]);

  const handleCheckin = (ref: string) => {
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === ref ? { ...b, status: 'checked_in' as const, actualCheckin: new Date().toISOString() } : b));
    setRooms(prev => prev.map(room => ({
      ...room,
      sections: room.sections.map(s => {
        const g = booking.guests.find(g => g.allocatedRoom === room.id && g.allocatedSection === s.sectionId);
        if (g) return { ...s, status: 'occupied' as const };
        return s;
      })
    })));
    toast.success('Checked in');
  };

  const handleCheckout = (ref: string) => {
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === ref ? { ...b, status: 'completed' as const } : b));
    booking.guests.forEach(g => {
      if (g.allocatedRoom && g.allocatedSection) {
        setRooms(prev => prev.map(room => room.id === g.allocatedRoom ? {
          ...room, sections: room.sections.map(s => s.sectionId === g.allocatedSection ? { ...s, status: 'maintenance' as const, guestName: null, bookingRef: null } : s)
        } : room));
        setTickets(prev => [...prev, {
          id: 'TK' + Date.now() + Math.random().toString(36).slice(2, 4), ghId: selectedGHId, roomId: g.allocatedRoom, sectionId: g.allocatedSection,
          floor: rooms.find(r => r.id === g.allocatedRoom)?.floor || 1,
          category: 'Post-checkout Cleaning', priority: 'Low' as const,
          description: 'Post-checkout cleaning required.', status: 'open' as const, reportedAt: new Date().toISOString().split('T')[0]
        }]);
      }
    });
    toast.success('Checkout complete');
  };

  const handleCancel = (ref: string) => {
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === ref ? { ...b, status: 'cancelled' as const, cancellationReason: 'Cancelled by manager' } : b));
    booking.guests.forEach(g => {
      if (g.allocatedRoom && g.allocatedSection) {
        setRooms(prev => prev.map(room => room.id === g.allocatedRoom ? {
          ...room, sections: room.sections.map(s => s.sectionId === g.allocatedSection ? { ...s, status: 'available' as const, guestName: null, bookingRef: null } : s)
        } : room));
      }
    });
    toast.success('Booking cancelled');
  };

  const renderEmailPreview = (ref: string) => {
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return null;
    const gh = guestHouses.find(g => g.id === booking.ghId);
    const mgr = managers.find(m => m.id === gh?.managerId);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="bg-card rounded-[10px] border border-border p-6 w-full max-w-lg max-h-[80vh] overflow-auto relative">
          <button
            onClick={() => setPreviewOpenForRef(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-lg"
          >
            ×
          </button>
          <h3 className="font-semibold mb-4">Email Preview — {booking.ref}</h3>
          <div className="text-sm space-y-2">
            <p className="font-bold">Subject: Booking Confirmation — {gh?.name} | Ref: {booking.ref}</p>
            {booking.guests.map((g, i) => (
              <div key={i} className="border-b border-border pb-2">
                <p>Guest: {g.name}</p>
                <p>Guest House: {gh?.name}, {gh?.address}</p>
                <p>Room: {rooms.find(r => r.id === g.allocatedRoom)?.number}-{g.allocatedSection}</p>
                <p>Check-in: {booking.checkin} | Check-out: {booking.checkout}</p>
                {g.pickup?.enabled && <p>Pickup: {g.pickup.location} at {g.pickup.time}. Vehicle: {g.pickup.vehicle}</p>}
                {g.drop?.enabled && <p>Drop: {g.drop.location} at {g.drop.time}. Vehicle: {g.drop.vehicle}</p>}
              </div>
            ))}
            <hr />
            <p className="whitespace-pre-line">{settings.dosAndDonts}</p>
            <p>Manager: {mgr?.name} · {mgr?.phone}</p>
            <p className="text-muted-foreground">Sent by Bharat Infra Corp Guest House Management System</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bookings</h1>
        <Button onClick={() => navigate('/manager/new-booking')} className="gap-1"><Plus className="h-4 w-4" /> New Booking</Button>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search ref, guest..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${tab === t ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-card rounded-[10px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Ref</th>
              <th className="text-left px-4 py-3 font-medium">Guests</th>
              <th className="text-left px-4 py-3 font-medium">Rooms</th>
              <th className="text-left px-4 py-3 font-medium">Check-in</th>
              <th className="text-left px-4 py-3 font-medium">Check-out</th>
              <th className="text-left px-4 py-3 font-medium">Nights</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(b => (
              <>
                <tr key={b.ref} className="border-t border-border cursor-pointer hover:bg-muted/30" onClick={() => setExpandedRef(expandedRef === b.ref ? null : b.ref)}>
                  <td className="px-4 py-3 font-medium">{b.ref}</td>
                  <td className="px-4 py-3">{b.guests.map(g => g.name).join(', ')}</td>
                  <td className="px-4 py-3">{b.guests.map(g => `${rooms.find(r => r.id === g.allocatedRoom)?.number || '?'}-${g.allocatedSection}`).join(', ')}</td>
                  <td className="px-4 py-3">{new Date(b.checkin).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{new Date(b.checkout).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{b.nights}</td>
                  <td className="px-4 py-3"><BookingStatusBadge status={b.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      {b.status === 'pending' && <span className="text-xs text-amber-600">{countdowns[b.ref]}</span>}
                      {b.status === 'pending' && <button onClick={() => handleCancel(b.ref)} title="Cancel"><X className="h-4 w-4 text-red-500" /></button>}
                      {b.status === 'confirmed' && <Button size="sm" onClick={() => handleCheckin(b.ref)} style={{ backgroundColor: '#22c55e', fontSize: '11px', padding: '2px 8px', height: '24px' }}>Check In</Button>}
                      {b.status === 'checked_in' && <Button size="sm" onClick={() => handleCheckout(b.ref)} style={{ backgroundColor: '#f59e0b', fontSize: '11px', padding: '2px 8px', height: '24px' }}>Check Out</Button>}
                      {['completed', 'rejected', 'cancelled'].includes(b.status) && <Eye className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setExpandedRef(b.ref)} />}
                    </div>
                  </td>
                </tr>
                {expandedRef === b.ref && (
                  <tr key={b.ref + '-detail'} className="bg-muted/20">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="text-sm space-y-2">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                          {b.guests.map((g, i) => (
                            <div key={i}>
                              <span className="font-medium">{g.name}</span> · {g.phone} · {g.company} · {g.type}
                              · Room {rooms.find(r => r.id === g.allocatedRoom)?.number}-{g.allocatedSection}
                              {g.pickup?.enabled && <span className="text-xs text-blue-600 ml-2">📍 Pickup: {g.pickup.location} at {g.pickup.time}</span>}
                              {g.drop?.enabled && <span className="text-xs text-amber-600 ml-2">📍 Drop: {g.drop.location} at {g.drop.time}</span>}
                            </div>
                          ))}
                        </div>
                        <p>Purpose: {b.purpose}</p>
                        {b.rejectionReason && <div className="p-2 rounded" style={{ backgroundColor: '#FCEBEB', color: '#501313' }}>Rejected: {b.rejectionReason}</div>}
                        {b.cancellationReason && <div className="p-2 rounded bg-muted">Cancelled: {b.cancellationReason}</div>}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPreviewOpenForRef(previewOpenForRef === b.ref ? null : b.ref)}
                        >
                          {previewOpenForRef === b.ref ? 'Close Preview' : 'Preview Email'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {previewOpenForRef && renderEmailPreview(previewOpenForRef)}
    </div>
  );
}
