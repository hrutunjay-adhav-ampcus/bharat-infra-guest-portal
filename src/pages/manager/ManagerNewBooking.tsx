import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, X, Check, AlertTriangle, CheckCircle } from 'lucide-react';
import { BookingGuest } from '@/types';

export default function ManagerNewBooking() {
  const { selectedGHId, rooms, settings, setBookings, setRooms, guestHouses, bookings } = useApp();
  const navigate = useNavigate();
  const gh = guestHouses.find(g => g.id === selectedGHId);
  const ghRooms = rooms.filter(r => r.ghId === selectedGHId);

  const [guests, setGuests] = useState<Partial<BookingGuest>[]>([
    { name: '', phone: '', company: '', type: 'employee', empId: '', gender: 'Male', email: '', allocatedRoom: null, allocatedSection: null }
  ]);
  const [checkinDate, setCheckinDate] = useState('');
  const [checkinTime, setCheckinTime] = useState(settings.checkinTime);
  const [checkoutDate, setCheckoutDate] = useState('');
  const [checkoutTime, setCheckoutTime] = useState(settings.checkoutTime);
  const [selectedSections, setSelectedSections] = useState<{ roomId: string; sectionId: string }[]>([]);
  const [pickup, setPickup] = useState({ enabled: false, location: '', date: '', time: '', vehicle: 'Car' });
  const [drop, setDrop] = useState({ enabled: false, location: '', date: '', time: '', vehicle: 'Car' });
  const [purpose, setPurpose] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');

  const nights = checkinDate && checkoutDate ? Math.max(0, Math.ceil((new Date(checkoutDate).getTime() - new Date(checkinDate).getTime()) / 86400000)) : 0;

  const availableSections = ghRooms.flatMap(r =>
    r.sections.filter(s => s.status === 'available').map(s => ({
      roomId: r.id,
      sectionId: s.sectionId,
      label: r.bhkCount === 1 ? `Room ${r.number} · ${r.bhkCount}BHK · Floor ${r.floor}` : `Room ${r.number}-${s.label} · ${r.bhkCount}BHK · Floor ${r.floor} (Section ${s.label})`,
    }))
  );

  const addGuest = () => setGuests([...guests, { name: '', phone: '', company: '', type: 'employee', empId: '', gender: 'Male', email: '', allocatedRoom: null, allocatedSection: null }]);
  const removeGuest = (i: number) => guests.length > 1 && setGuests(guests.filter((_, idx) => idx !== i));

  const toggleSection = (roomId: string, sectionId: string) => {
    const exists = selectedSections.find(s => s.roomId === roomId && s.sectionId === sectionId);
    if (exists) {
      setSelectedSections(selectedSections.filter(s => !(s.roomId === roomId && s.sectionId === sectionId)));
    } else {
      setSelectedSections([...selectedSections, { roomId, sectionId }]);
    }
  };

  const isValid = () => {
    if (guests.some(g => !g.name || !g.phone)) return false;
    if (!checkinDate || !checkoutDate) return false;
    if (nights <= 0) return false;
    if (selectedSections.length === 0) return false;
    if (guests.some(g => !g.allocatedRoom || !g.allocatedSection)) return false;
    if (pickup.enabled && (!pickup.location || !pickup.date || !pickup.time)) return false;
    if (drop.enabled && (!drop.location || !drop.date || !drop.time)) return false;
    return true;
  };

  const handleSubmit = () => {
    if (!isValid()) { toast.error('Please fill all required fields'); return; }

    const ref = 'BK' + String(bookings.length + 1).padStart(3, '0');
    const newBooking = {
      ref,
      ghId: selectedGHId,
      guests: guests.map(g => ({
        name: g.name!, phone: g.phone!, company: g.company || '', type: g.type! as 'employee' | 'visitor',
        empId: g.empId || null, gender: g.gender! as 'Male' | 'Female', email: g.email || '',
        allocatedRoom: g.allocatedRoom!, allocatedSection: g.allocatedSection!,
      })),
      checkin: `${checkinDate}T${checkinTime}`,
      checkout: `${checkoutDate}T${checkoutTime}`,
      nights,
      status: 'pending' as const,
      pendingExpiresAt: Date.now() + settings.bookingExpiryHours * 3600000,
      pickup: pickup.enabled ? pickup : { enabled: false },
      drop: drop.enabled ? drop : { enabled: false },
      purpose,
      emailSent: false,
      occupancyType: 'single_section',
    };

    setBookings(prev => [...prev, newBooking]);
    // Mark sections as pending_approval
    setRooms(prev => prev.map(room => ({
      ...room,
      sections: room.sections.map(s => {
        const isSelected = selectedSections.some(ss => ss.roomId === room.id && ss.sectionId === s.sectionId);
        if (isSelected) {
          const guest = guests.find(g => g.allocatedRoom === room.id && g.allocatedSection === s.sectionId);
          return { ...s, status: 'pending_approval' as const, guestName: guest?.name || null, bookingRef: ref };
        }
        return s;
      })
    })));

    setBookingRef(ref);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#E1F5EE' }}>
          <CheckCircle className="h-8 w-8" style={{ color: '#1D9E75' }} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Booking Request Submitted ✓</h2>
        <p className="text-lg font-semibold mb-2">{bookingRef}</p>
        <p className="text-muted-foreground mb-6">Awaiting admin approval. Sections temporarily reserved.</p>
        <Button onClick={() => navigate('/manager/room-grid')}>Back to Room Grid</Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Booking — {gh?.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Guest Info */}
        <div className="bg-card rounded-[10px] border border-border p-5">
          <h3 className="font-semibold mb-4">Guest Information</h3>
          {guests.map((g, i) => (
            <div key={i} className="border border-border rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Guest {i + 1}</span>
                <div className="flex items-center gap-2">
                  <select className="text-xs border border-border rounded px-2 py-1" value={g.type} onChange={e => {
                    const updated = [...guests]; updated[i] = { ...updated[i], type: e.target.value as any }; setGuests(updated);
                  }}>
                    <option value="employee">Employee</option>
                    <option value="visitor">Visitor</option>
                  </select>
                  {guests.length > 1 && <button onClick={() => removeGuest(i)}><X className="h-4 w-4 text-muted-foreground" /></button>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Full Name *" value={g.name || ''} onChange={e => { const u = [...guests]; u[i] = { ...u[i], name: e.target.value }; setGuests(u); }} />
                <Input placeholder="Phone *" value={g.phone || ''} onChange={e => { const u = [...guests]; u[i] = { ...u[i], phone: e.target.value }; setGuests(u); }} />
                <Input placeholder="Email" value={g.email || ''} onChange={e => { const u = [...guests]; u[i] = { ...u[i], email: e.target.value }; setGuests(u); }} />
                <Input placeholder={g.type === 'employee' ? 'Employee ID' : 'Visitor ID'} value={g.empId || ''} onChange={e => { const u = [...guests]; u[i] = { ...u[i], empId: e.target.value }; setGuests(u); }} />
                <Input placeholder="Company/Dept" value={g.company || ''} onChange={e => { const u = [...guests]; u[i] = { ...u[i], company: e.target.value }; setGuests(u); }} />
                <select className="border border-border rounded-md px-3 py-2 text-sm" value={g.gender} onChange={e => { const u = [...guests]; u[i] = { ...u[i], gender: e.target.value as any }; setGuests(u); }}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addGuest} className="gap-1"><Plus className="h-4 w-4" /> Add Guest</Button>
        </div>

        {/* Right - Schedule & Rooms */}
        <div className="bg-card rounded-[10px] border border-border p-5">
          <h3 className="font-semibold mb-4">Rooms & Schedule</h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><Label>Check-in Date *</Label><Input type="date" value={checkinDate} onChange={e => setCheckinDate(e.target.value)} /></div>
            <div><Label>Check-in Time</Label><Input type="time" value={checkinTime} onChange={e => setCheckinTime(e.target.value)} /></div>
            <div><Label>Check-out Date *</Label><Input type="date" value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)} /></div>
            <div><Label>Check-out Time</Label><Input type="time" value={checkoutTime} onChange={e => setCheckoutTime(e.target.value)} /></div>
          </div>
          {nights > 0 && <p className="text-sm mb-4">{nights} night(s)</p>}

          <div className="mb-4">
            <Label>Select Sections</Label>
            <div className="max-h-40 overflow-auto border border-border rounded-md mt-1">
              {availableSections.map(s => (
                <label key={`${s.roomId}-${s.sectionId}`} className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 cursor-pointer text-sm">
                  <input type="checkbox" checked={selectedSections.some(ss => ss.roomId === s.roomId && ss.sectionId === s.sectionId)} onChange={() => toggleSection(s.roomId, s.sectionId)} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>

          {selectedSections.length > 0 && (
            <div className="mb-4">
              <p className="flex items-center gap-1 text-sm mb-2" style={{ color: '#22c55e' }}>
                <Check className="h-4 w-4" /> All selected sections available
              </p>
            </div>
          )}

          {selectedSections.length > 0 && guests.length > 0 && (
            <div className="mb-4">
              <Label>Guest-to-Section Allocation</Label>
              {guests.map((g, i) => (
                <div key={i} className="flex items-center gap-2 mt-1">
                  <span className="text-sm flex-1 truncate">{g.name || `Guest ${i + 1}`}</span>
                  <select className="border border-border rounded-md px-2 py-1 text-sm" value={`${g.allocatedRoom}|${g.allocatedSection}`}
                    onChange={e => {
                      const [roomId, sectionId] = e.target.value.split('|');
                      const u = [...guests]; u[i] = { ...u[i], allocatedRoom: roomId, allocatedSection: sectionId }; setGuests(u);
                    }}>
                    <option value="|">Select section</option>
                    {selectedSections.map(ss => {
                      const room = rooms.find(r => r.id === ss.roomId);
                      return <option key={`${ss.roomId}-${ss.sectionId}`} value={`${ss.roomId}|${ss.sectionId}`}>Room {room?.number}-{ss.sectionId}</option>;
                    })}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Pickup */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={pickup.enabled} onChange={e => setPickup({ ...pickup, enabled: e.target.checked })} />
              Pickup Required
            </label>
            {pickup.enabled && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input placeholder="Location *" value={pickup.location} onChange={e => setPickup({ ...pickup, location: e.target.value })} />
                <Input type="date" value={pickup.date} onChange={e => setPickup({ ...pickup, date: e.target.value })} />
                <Input type="time" value={pickup.time} onChange={e => setPickup({ ...pickup, time: e.target.value })} />
                <select className="border border-border rounded-md px-3 py-2 text-sm" value={pickup.vehicle} onChange={e => setPickup({ ...pickup, vehicle: e.target.value })}>
                  <option>Car</option><option>Van</option><option>Bus</option><option>Auto-arrange</option>
                </select>
              </div>
            )}
          </div>

          {/* Drop */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={drop.enabled} onChange={e => setDrop({ ...drop, enabled: e.target.checked })} />
              Drop Required
            </label>
            {drop.enabled && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Input placeholder="Location *" value={drop.location} onChange={e => setDrop({ ...drop, location: e.target.value })} />
                <Input type="date" value={drop.date} onChange={e => setDrop({ ...drop, date: e.target.value })} />
                <Input type="time" value={drop.time} onChange={e => setDrop({ ...drop, time: e.target.value })} />
                <select className="border border-border rounded-md px-3 py-2 text-sm" value={drop.vehicle} onChange={e => setDrop({ ...drop, vehicle: e.target.value })}>
                  <option>Car</option><option>Van</option><option>Bus</option><option>Auto-arrange</option>
                </select>
              </div>
            )}
          </div>

          <div className="mb-4">
            <Label>Purpose</Label>
            <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="Purpose of visit" />
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t border-border py-4 mt-6 flex gap-2 justify-end">
        <Button variant="outline" onClick={() => navigate('/manager/room-grid')}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!isValid()}>Submit for Approval</Button>
      </div>
    </div>
  );
}
