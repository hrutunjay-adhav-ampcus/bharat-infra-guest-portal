import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { BedDouble, Users, Clock, Wrench, Plane, Car } from 'lucide-react';
import { toast } from 'sonner';

export default function ManagerDashboard() {
  const { selectedGHId, rooms, bookings, tickets, setBookings, setRooms, setTickets, guestHouses } = useApp();
  const ghRooms = rooms.filter(r => r.ghId === selectedGHId);
  const ghBookings = bookings.filter(b => b.ghId === selectedGHId);
  const ghTickets = tickets.filter(t => t.ghId === selectedGHId);
  const currentGH = guestHouses.find(g => g.id === selectedGHId);

  const allSections = ghRooms.flatMap(r => r.sections);
  const available = allSections.filter(s => s.status === 'available').length;
  const occupied = allSections.filter(s => s.status === 'occupied').length;
  const pending = allSections.filter(s => s.status === 'pending_approval').length;
  const maintenance = allSections.filter(s => s.status === 'maintenance').length;

  const today = new Date().toISOString().split('T')[0];
  const checkinsToday = ghBookings.filter(b => b.checkin.startsWith(today) && b.status === 'confirmed');
  const checkoutsToday = ghBookings.filter(b => b.checkout.startsWith(today) && b.status === 'checked_in');

  const pickupsDrops = ghBookings.filter(b => ['confirmed', 'checked_in'].includes(b.status)).flatMap(b => {
    const items: any[] = [];
    if (b.pickup.enabled && b.pickup.date === today) items.push({ type: 'pickup', ...b.pickup, guest: b.guests[0]?.name, ref: b.ref, room: b.guests[0]?.allocatedRoom });
    if (b.drop.enabled && b.drop.date === today) items.push({ type: 'drop', ...b.drop, guest: b.guests[0]?.name, ref: b.ref, room: b.guests[0]?.allocatedRoom });
    return items;
  });

  const openTickets = ghTickets.filter(t => t.status !== 'resolved');

  const handleCheckin = (ref: string) => {
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === ref ? { ...b, status: 'checked_in' as const, actualCheckin: new Date().toISOString() } : b));
    setRooms(prev => prev.map(room => ({
      ...room,
      sections: room.sections.map(s => {
        const guest = booking.guests.find(g => g.allocatedRoom === room.id && g.allocatedSection === s.sectionId);
        if (guest) return { ...s, status: 'occupied' as const };
        return s;
      })
    })));
    toast.success('Checked in successfully');
  };

  const handleCheckout = (ref: string) => {
    const booking = bookings.find(b => b.ref === ref);
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === ref ? { ...b, status: 'completed' as const } : b));
    booking.guests.forEach(g => {
      if (g.allocatedRoom && g.allocatedSection) {
        setRooms(prev => prev.map(room => room.id === g.allocatedRoom ? {
          ...room,
          sections: room.sections.map(s => s.sectionId === g.allocatedSection ? { ...s, status: 'maintenance' as const, guestName: null, bookingRef: null } : s)
        } : room));
        const tkId = 'TK' + Date.now() + Math.random().toString(36).slice(2, 4);
        setTickets(prev => [...prev, {
          id: tkId, ghId: selectedGHId, roomId: g.allocatedRoom, sectionId: g.allocatedSection,
          floor: rooms.find(r => r.id === g.allocatedRoom)?.floor || 1,
          category: 'Post-checkout Cleaning', priority: 'Low' as const,
          description: 'Post-checkout cleaning required.',
          status: 'open' as const, reportedAt: new Date().toISOString().split('T')[0]
        }]);
      }
    });
    toast.success('Checkout complete. Sections marked for post-checkout cleaning.');
  };

  if (!selectedGHId) {
    return <div className="text-center py-20 text-muted-foreground">No guest houses assigned</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">{currentGH?.name}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Available Rooms" value={available} icon={BedDouble} color="#22c55e" />
        <StatCard title="Occupied Rooms" value={occupied} icon={Users} color="#7f77dd" />
        <StatCard title="Pending Approval" value={pending} icon={Clock} color="#f59e0b" />
        <StatCard title="Under Maintenance" value={maintenance} icon={Wrench} color="#ef4444" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-[10px] border border-border p-5">
          <h3 className="font-semibold mb-3">Check-ins Today</h3>
          {checkinsToday.length === 0 ? <p className="text-sm text-muted-foreground">None scheduled</p> : (
            <div className="space-y-2">
              {checkinsToday.map(b => (
                <div key={b.ref} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="text-sm">
                    <span className="font-medium">{b.guests.map(g => g.name).join(', ')}</span>
                    <span className="text-muted-foreground ml-2">{b.ref}</span>
                  </div>
                  <Button size="sm" onClick={() => handleCheckin(b.ref)} style={{ backgroundColor: '#22c55e' }}>Check In</Button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card rounded-[10px] border border-border p-5">
          <h3 className="font-semibold mb-3">Check-outs Today</h3>
          {checkoutsToday.length === 0 ? <p className="text-sm text-muted-foreground">None scheduled</p> : (
            <div className="space-y-2">
              {checkoutsToday.map(b => (
                <div key={b.ref} className="flex items-center justify-between p-2 rounded bg-muted/50">
                  <div className="text-sm">
                    <span className="font-medium">{b.guests.map(g => g.name).join(', ')}</span>
                    <span className="text-muted-foreground ml-2">{b.ref}</span>
                  </div>
                  <Button size="sm" onClick={() => handleCheckout(b.ref)} style={{ backgroundColor: '#f59e0b' }}>Check Out</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {pickupsDrops.length > 0 && (
        <div className="bg-card rounded-[10px] border border-border p-5 mb-8">
          <h3 className="font-semibold mb-3">Pickup & Drop Today</h3>
          <div className="space-y-2">
            {pickupsDrops.map((pd, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm">
                {pd.type === 'pickup' ? <Plane className="h-4 w-4 text-blue-500" /> : <Car className="h-4 w-4 text-amber-500" />}
                <span className={`text-xs px-2 py-0.5 rounded-full ${pd.type === 'pickup' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                  {pd.type.toUpperCase()}
                </span>
                <span className="font-medium">{pd.guest}</span>
                <span className="text-muted-foreground">{pd.location} at {pd.time}</span>
                <span className="text-muted-foreground ml-auto">{pd.ref}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {openTickets.length > 0 && (
        <div className="bg-card rounded-[10px] border border-border p-5">
          <h3 className="font-semibold mb-3">Open Maintenance Issues</h3>
          <div className="space-y-2">
            {openTickets.map(t => {
              const room = rooms.find(r => r.id === t.roomId);
              return (
                <div key={t.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                  <span>Room {room?.number}-{t.sectionId} · {t.category} · {t.priority}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === 'open' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {t.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
