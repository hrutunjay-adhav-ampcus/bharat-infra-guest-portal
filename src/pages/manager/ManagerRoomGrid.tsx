import { useApp } from '@/context/AppContext';
import RoomCard from '@/components/RoomCard';
import { BookingStatusBadge } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { X, BedDouble } from 'lucide-react';
import { Room } from '@/types';

const STATUS_FILTERS = ['all', 'available', 'pending_approval', 'booked', 'occupied', 'maintenance'] as const;
const STATUS_LABELS: Record<string, string> = {
  all: 'All', available: 'Available', pending_approval: 'Pending Approval',
  booked: 'Booked', occupied: 'Occupied', maintenance: 'Maintenance'
};

export default function ManagerRoomGrid() {
  const { selectedGHId, rooms, bookings, tickets, setBookings, setRooms, setTickets, guestHouses, managers, settings } = useApp();
  const navigate = useNavigate();
  const gh = guestHouses.find(g => g.id === selectedGHId);
  const ghRooms = rooms.filter(r => r.ghId === selectedGHId);
  const floorCount = gh?.floors || 1;

  const [floor, setFloor] = useState(1);
  const [filter, setFilter] = useState<string>('all');
  const [drawer, setDrawer] = useState<{ room: Room; sectionId: string } | null>(null);
  const [popover, setPopover] = useState<Room | null>(null);

  const floorRooms = ghRooms.filter(r => r.floor === floor);
  const filteredRooms = filter === 'all' ? floorRooms : floorRooms.filter(r => r.sections.some(s => s.status === filter));

  const getSectionCounts = (status: string) => {
    const all = ghRooms.flatMap(r => r.sections);
    return status === 'all' ? all.length : all.filter(s => s.status === status).length;
  };

  const handleRoomClick = (room: Room, sectionId?: string) => {
    if (room.bhkCount === 1 && sectionId) {
      setDrawer({ room, sectionId });
      setPopover(null);
    } else {
      setPopover(room);
      setDrawer(null);
    }
  };

  const openDrawer = (room: Room, sectionId: string) => {
    const section = room.sections.find(s => s.sectionId === sectionId);
    if (section?.status === 'pending_approval') {
      toast.error('Awaiting admin approval');
      return;
    }
    setDrawer({ room, sectionId });
    setPopover(null);
  };

  const section = drawer ? drawer.room.sections.find(s => s.sectionId === drawer.sectionId) : null;
  const booking = section?.bookingRef ? bookings.find(b => b.ref === section.bookingRef) : null;
  const guest = booking?.guests.find(g => g.allocatedRoom === drawer?.room.id && g.allocatedSection === drawer?.sectionId);

  const handleCheckin = () => {
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === booking.ref ? { ...b, status: 'checked_in' as const, actualCheckin: new Date().toISOString() } : b));
    setRooms(prev => prev.map(room => ({
      ...room,
      sections: room.sections.map(s => {
        const g = booking.guests.find(g => g.allocatedRoom === room.id && g.allocatedSection === s.sectionId);
        if (g) return { ...s, status: 'occupied' as const };
        return s;
      })
    })));
    toast.success('Checked in successfully');
    setDrawer(null);
  };

  const handleCheckout = () => {
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === booking.ref ? { ...b, status: 'completed' as const } : b));
    booking.guests.forEach(g => {
      if (g.allocatedRoom && g.allocatedSection) {
        setRooms(prev => prev.map(room => room.id === g.allocatedRoom ? {
          ...room,
          sections: room.sections.map(s => s.sectionId === g.allocatedSection ? { ...s, status: 'maintenance' as const, guestName: null, bookingRef: null } : s)
        } : room));
        setTickets(prev => [...prev, {
          id: 'TK' + Date.now(), ghId: selectedGHId, roomId: g.allocatedRoom, sectionId: g.allocatedSection,
          floor: rooms.find(r => r.id === g.allocatedRoom)?.floor || 1,
          category: 'Post-checkout Cleaning', priority: 'Low' as const,
          description: 'Post-checkout cleaning required.',
          status: 'open' as const, reportedAt: new Date().toISOString().split('T')[0]
        }]);
      }
    });
    toast.success('Checkout complete. Sections marked for cleaning.');
    setDrawer(null);
  };

  const handleCancel = () => {
    if (!booking) return;
    setBookings(prev => prev.map(b => b.ref === booking.ref ? { ...b, status: 'cancelled' as const, cancellationReason: 'Cancelled by manager' } : b));
    booking.guests.forEach(g => {
      if (g.allocatedRoom && g.allocatedSection) {
        setRooms(prev => prev.map(room => room.id === g.allocatedRoom ? {
          ...room,
          sections: room.sections.map(s => s.sectionId === g.allocatedSection ? { ...s, status: 'available' as const, guestName: null, bookingRef: null } : s)
        } : room));
      }
    });
    toast.success('Booking cancelled');
    setDrawer(null);
  };

  const ghTickets = tickets.filter(t => t.ghId === selectedGHId);

  if (!selectedGHId) return <div className="text-center py-20 text-muted-foreground">No guest houses assigned</div>;

  return (
    <div className="flex gap-0">
      <div className={`flex-1 transition-all ${drawer ? 'mr-[380px]' : ''}`}>
        <h1 className="text-2xl font-bold mb-1">Room Grid</h1>
        <p className="text-sm text-muted-foreground mb-4">{gh?.name}</p>

        <div className="flex gap-2 mb-4">
          {Array.from({ length: floorCount }, (_, i) => i + 1).map(f => (
            <button key={f} onClick={() => setFloor(f)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${floor === f ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
              Floor {f}
            </button>
          ))}
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {STATUS_FILTERS.map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
              {STATUS_LABELS[s]} ({getSectionCounts(s)})
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative">
          {filteredRooms.map(room => (
            <div key={room.id} className="relative">
              <RoomCard room={room} tickets={ghTickets} onClick={handleRoomClick} />
              {popover?.id === room.id && room.bhkCount > 1 && (
                <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg p-2">
                  {room.sections.map(s => {
                    const isPending = s.status === 'pending_approval';
                    return (
                      <button
                        key={s.sectionId}
                        onClick={() => !isPending && openDrawer(room, s.sectionId)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/50 ${isPending ? 'cursor-not-allowed opacity-50' : ''}`}
                        title={isPending ? 'Awaiting admin approval' : undefined}
                      >
                        {room.number}-{s.label} · <span className="capitalize">{s.status.replace('_', ' ')}</span>
                        {s.guestName && ` (${s.guestName})`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {drawer && section && (
        <div className="fixed right-0 top-0 h-full w-[380px] bg-card border-l border-border shadow-lg z-40 overflow-auto">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">
                Room {drawer.room.number} · Section {drawer.sectionId} · {drawer.room.bhkCount}BHK · Floor {drawer.room.floor}
              </h3>
              <button onClick={() => setDrawer(null)}><X className="h-4 w-4" /></button>
            </div>

            <div className="flex gap-1 flex-wrap mb-4">
              {drawer.room.amenities.map(a => (
                <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-muted">{a}</span>
              ))}
            </div>

            {section.status === 'available' && (
              <div>
                <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#E1F5EE' }}>
                  <p className="text-sm font-medium" style={{ color: '#085041' }}>This section is available</p>
                </div>
                <Button onClick={() => navigate('/manager/new-booking')} className="w-full mb-2 gap-1">
                  <BedDouble className="h-4 w-4" /> Book This Section
                </Button>
                {drawer.room.bhkCount > 1 && (
                  <Button variant="outline" onClick={() => navigate('/manager/new-booking')} className="w-full">
                    Book Entire {drawer.room.bhkCount}BHK
                  </Button>
                )}
                {drawer.room.bhkCount > 1 && (
                  <div className="mt-4">
                    <h4 className="text-xs font-medium text-muted-foreground mb-2">Other Sections</h4>
                    {drawer.room.sections.filter(s => s.sectionId !== drawer.sectionId).map(s => (
                      <div key={s.sectionId} className="text-xs py-1">
                        Section {s.label}: <span className="capitalize">{s.status.replace('_', ' ')}</span>
                        {s.guestName && ` — ${s.guestName}`}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section.status === 'booked' && booking && (
              <div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Booking Ref</span><span className="font-medium">{booking.ref}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span>{guest?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{guest?.phone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Company</span><span>{guest?.company}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Check-in</span><span>{new Date(booking.checkin).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span>{new Date(booking.checkout).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Nights</span><span>{booking.nights}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Purpose</span><span>{booking.purpose}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCheckin} style={{ backgroundColor: '#22c55e' }} className="flex-1">Check In</Button>
                  <Button variant="outline" onClick={handleCancel} style={{ borderColor: '#ef4444', color: '#ef4444' }} className="flex-1">Cancel</Button>
                </div>
              </div>
            )}

            {section.status === 'occupied' && booking && (
              <div>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-muted-foreground">Booking Ref</span><span className="font-medium">{booking.ref}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Guest</span><span>{guest?.name}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{guest?.phone}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Checked In</span><span>{booking.actualCheckin ? new Date(booking.actualCheckin).toLocaleString() : '-'}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Check-out</span><span>{new Date(booking.checkout).toLocaleDateString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Purpose</span><span>{booking.purpose}</span></div>
                </div>
                <Button onClick={handleCheckout} style={{ backgroundColor: '#f59e0b' }} className="w-full">Check Out</Button>
              </div>
            )}

            {section.status === 'maintenance' && (() => {
              const ticket = ghTickets.find(t => t.roomId === drawer.room.id && t.sectionId === drawer.sectionId && t.status !== 'resolved');
              return ticket ? (
                <div>
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{ticket.category}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><span>{ticket.priority}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Description</span><span>{ticket.description}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Reported</span><span>{ticket.reportedAt}</span></div>
                  </div>
                  {ticket.status === 'open' && (
                    <Button onClick={() => {
                      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'in_progress' as const } : t));
                      toast.success('Ticket marked in progress');
                    }} className="w-full">Mark In Progress</Button>
                  )}
                  {ticket.status === 'in_progress' && (
                    <Button onClick={() => {
                      setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'resolved' as const, resolvedAt: new Date().toISOString().split('T')[0], resolutionHours: 1, resolutionNote: 'Resolved' } : t));
                      setRooms(prev => prev.map(room => room.id === drawer.room.id ? {
                        ...room, sections: room.sections.map(s => s.sectionId === drawer.sectionId ? { ...s, status: 'available' as const } : s)
                      } : room));
                      toast.success(`Room ${drawer.room.number} Section ${drawer.sectionId} is now available`);
                      setDrawer(null);
                    }} style={{ backgroundColor: '#22c55e' }} className="w-full">Mark Resolved</Button>
                  )}
                </div>
              ) : <p className="text-sm text-muted-foreground">Under maintenance</p>;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
