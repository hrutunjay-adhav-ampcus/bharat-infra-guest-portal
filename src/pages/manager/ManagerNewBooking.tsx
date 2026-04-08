import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, X, Check, CheckCircle } from 'lucide-react';
import { GuestPickupDrop } from '@/types';

interface GuestRow {
  name: string;
  phone: string;
  company: string;
  type: 'employee' | 'visitor';
  empId: string;
  gender: 'Male' | 'Female';
  email: string;
  allocatedRoom: string | null;
  allocatedSection: string | null;
  pickup: GuestPickupDrop;
  drop: GuestPickupDrop;
}

const emptyPickupDrop = (): GuestPickupDrop => ({ enabled: false, location: '', date: '', time: '', vehicle: 'Car', notes: '' });

const emptyGuest = (): GuestRow => ({
  name: '', phone: '', company: '', type: 'employee', empId: '', gender: 'Male', email: '',
  allocatedRoom: null, allocatedSection: null,
  pickup: emptyPickupDrop(), drop: emptyPickupDrop(),
});

export default function ManagerNewBooking() {
  const { selectedGHId, rooms, settings, setBookings, setRooms, guestHouses, bookings } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const gh = guestHouses.find(g => g.id === selectedGHId);
  const ghRooms = rooms.filter(r => r.ghId === selectedGHId);

  const [guests, setGuests] = useState<GuestRow[]>([emptyGuest()]);
  const [checkinDate, setCheckinDate] = useState('');
  const [checkinTime, setCheckinTime] = useState(settings.checkinTime);
  const [checkoutDate, setCheckoutDate] = useState('');
  const [checkoutTime, setCheckoutTime] = useState(settings.checkoutTime);
  const [selectedSections, setSelectedSections] = useState<{ roomId: string; sectionId: string }[]>([]);
  const [purpose, setPurpose] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [fullUnitRoomIds, setFullUnitRoomIds] = useState<Set<string>>(new Set());
  const [unavailableError, setUnavailableError] = useState('');

  // CHANGE 2: Read URL params for full unit pre-selection
  useEffect(() => {
    const mode = searchParams.get('mode');
    const roomId = searchParams.get('roomId');
    if (mode === 'full_unit' && roomId) {
      const room = ghRooms.find(r => r.id === roomId);
      if (room) {
        const allAvailable = room.sections.every(s => s.status === 'available');
        if (allAvailable) {
          setFullUnitRoomIds(new Set([roomId]));
          setSelectedSections(room.sections.map(s => ({ roomId: room.id, sectionId: s.sectionId })));
        } else {
          setUnavailableError(`Room ${room.number} has unavailable sections. Full unit booking blocked.`);
        }
      }
    }
  }, []);

  const nights = checkinDate && checkoutDate ? Math.max(0, Math.ceil((new Date(checkoutDate).getTime() - new Date(checkinDate).getTime()) / 86400000)) : 0;

  // CHANGE 3: Group and sort available sections by BHK
  const availableSections = useMemo(() => {
    const sections = ghRooms.flatMap(r =>
      r.sections.filter(s => s.status === 'available').map(s => ({
        roomId: r.id,
        sectionId: s.sectionId,
        label: r.bhkCount === 1 ? `Room ${r.number} · ${r.bhkCount}BHK · Floor ${r.floor}` : `Room ${r.number}-${s.label} · ${r.bhkCount}BHK · Floor ${r.floor} (Section ${s.label})`,
        bhkCount: r.bhkCount,
        roomNumber: r.number,
        sectionLabel: s.label,
      }))
    );
    return sections.sort((a, b) => {
      if (a.bhkCount !== b.bhkCount) return a.bhkCount - b.bhkCount;
      if (a.roomNumber !== b.roomNumber) return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
      return a.sectionLabel.localeCompare(b.sectionLabel);
    });
  }, [ghRooms]);

  const groupedSections = useMemo(() => {
    const groups: { bhk: number; items: typeof availableSections }[] = [];
    let currentBhk = -1;
    for (const s of availableSections) {
      if (s.bhkCount !== currentBhk) {
        currentBhk = s.bhkCount;
        groups.push({ bhk: currentBhk, items: [] });
      }
      groups[groups.length - 1].items.push(s);
    }
    return groups;
  }, [availableSections]);

  // CHANGE 2: Full unit toggle helpers
  const isFullUnitRoom = (roomId: string) => fullUnitRoomIds.has(roomId);

  const toggleFullUnit = (roomId: string) => {
    const room = ghRooms.find(r => r.id === roomId);
    if (!room) return;

    if (isFullUnitRoom(roomId)) {
      // Turn off full unit
      setFullUnitRoomIds(prev => { const n = new Set(prev); n.delete(roomId); return n; });
      setSelectedSections(prev => prev.filter(s => s.roomId !== roomId));
    } else {
      // Check all available
      const allAvailable = room.sections.every(s => s.status === 'available');
      if (!allAvailable) {
        toast.error(`Cannot book entire room ${room.number} — not all sections available`);
        return;
      }
      // Check for individual selections conflict
      const hasIndividual = selectedSections.some(s => s.roomId === roomId);
      if (hasIndividual) {
        // Auto-deselect individual
        setSelectedSections(prev => prev.filter(s => s.roomId !== roomId));
      }
      setFullUnitRoomIds(prev => new Set([...prev, roomId]));
      setSelectedSections(prev => [
        ...prev.filter(s => s.roomId !== roomId),
        ...room.sections.map(s => ({ roomId: room.id, sectionId: s.sectionId }))
      ]);
    }
  };

  const addGuest = () => setGuests([...guests, emptyGuest()]);
  const removeGuest = (i: number) => guests.length > 1 && setGuests(guests.filter((_, idx) => idx !== i));

  const updateGuest = (i: number, updates: Partial<GuestRow>) => {
    const u = [...guests];
    u[i] = { ...u[i], ...updates };
    setGuests(u);
  };

  const updateGuestPickup = (i: number, updates: Partial<GuestPickupDrop>) => {
    const u = [...guests];
    u[i] = { ...u[i], pickup: { ...u[i].pickup, ...updates } };
    setGuests(u);
  };

  const updateGuestDrop = (i: number, updates: Partial<GuestPickupDrop>) => {
    const u = [...guests];
    u[i] = { ...u[i], drop: { ...u[i].drop, ...updates } };
    setGuests(u);
  };

  const toggleSection = (roomId: string, sectionId: string) => {
    // If this room is in full unit mode, don't allow individual toggle
    if (isFullUnitRoom(roomId)) return;

    const exists = selectedSections.find(s => s.roomId === roomId && s.sectionId === sectionId);
    if (exists) {
      setSelectedSections(selectedSections.filter(s => !(s.roomId === roomId && s.sectionId === sectionId)));
    } else {
      setSelectedSections([...selectedSections, { roomId, sectionId }]);
    }
  };

  // Real-time validation for full unit rooms
  useEffect(() => {
    for (const roomId of fullUnitRoomIds) {
      const room = rooms.find(r => r.id === roomId);
      if (room && !room.sections.every(s => s.status === 'available')) {
        const section = room.sections.find(s => s.status !== 'available');
        setUnavailableError(`Room ${room.number}-${section?.label} is no longer available. Full unit booking blocked.`);
        return;
      }
    }
    setUnavailableError('');
  }, [rooms, fullUnitRoomIds]);

  // Get multi-BHK rooms for full-unit toggle display
  const multiBhkRooms = ghRooms.filter(r => r.bhkCount > 1 && r.sections.every(s => s.status === 'available'));
  // Check if any individual section is selected for a room (to show conflict warning)
  const getIndividualConflict = (roomId: string) => {
    return selectedSections.some(s => s.roomId === roomId) && !isFullUnitRoom(roomId);
  };

  const isValid = () => {
    if (guests.some(g => !g.name || !g.phone)) return false;
    if (!checkinDate || !checkoutDate) return false;
    if (nights <= 0) return false;
    if (selectedSections.length === 0) return false;
    if (guests.some(g => !g.allocatedRoom || !g.allocatedSection)) return false;
    if (unavailableError) return false;
    for (const g of guests) {
      if (g.pickup.enabled && (!g.pickup.location || !g.pickup.date || !g.pickup.time)) return false;
      if (g.drop.enabled && (!g.drop.location || !g.drop.date || !g.drop.time)) return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!isValid()) { toast.error('Please fill all required fields'); return; }

    const ref = 'BK' + String(bookings.length + 1).padStart(3, '0');
    const newBooking = {
      ref,
      ghId: selectedGHId,
      guests: guests.map(g => ({
        name: g.name, phone: g.phone, company: g.company || '', type: g.type,
        empId: g.empId || null, gender: g.gender, email: g.email || '',
        allocatedRoom: g.allocatedRoom!, allocatedSection: g.allocatedSection!,
        pickup: g.pickup.enabled ? g.pickup : { enabled: false as const },
        drop: g.drop.enabled ? g.drop : { enabled: false as const },
      })),
      checkin: `${checkinDate}T${checkinTime}`,
      checkout: `${checkoutDate}T${checkoutTime}`,
      nights,
      status: 'pending' as const,
      pendingExpiresAt: Date.now() + settings.bookingExpiryHours * 3600000,
      pickup: { enabled: false } as const,
      drop: { enabled: false } as const,
      purpose,
      emailSent: false,
      occupancyType: fullUnitRoomIds.size > 0 ? 'full_unit' : 'single_section',
    };

    setBookings(prev => [...prev, newBooking]);
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

  // Build the full unit banner
  const fullUnitBanner = Array.from(fullUnitRoomIds).map(roomId => {
    const room = ghRooms.find(r => r.id === roomId);
    if (!room) return null;
    return (
      <div key={roomId} className="p-3 rounded-lg mb-3 border border-border" style={{ backgroundColor: '#E6F1FB' }}>
        <p className="text-sm font-medium" style={{ color: '#042C53' }}>
          Booking entire Room {room.number} — {room.bhkCount}BHK (Sections {room.sections.map(s => s.label).join(', ')})
        </p>
      </div>
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Booking — {gh?.name}</h1>

      {unavailableError && (
        <div className="p-3 rounded-lg mb-4 border" style={{ backgroundColor: '#FCEBEB', borderColor: '#F09595' }}>
          <p className="text-sm font-medium" style={{ color: '#501313' }}>{unavailableError}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-[10px] border border-border p-5">
          <h3 className="font-semibold mb-4">Guest Information</h3>
          {guests.map((g, i) => (
            <div key={i} className="border border-border rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Guest {i + 1}</span>
                <div className="flex items-center gap-2">
                  <select className="text-xs border border-border rounded px-2 py-1" value={g.type} onChange={e => updateGuest(i, { type: e.target.value as any })}>
                    <option value="employee">Employee</option>
                    <option value="visitor">Visitor</option>
                  </select>
                  {guests.length > 1 && <button onClick={() => removeGuest(i)}><X className="h-4 w-4 text-muted-foreground" /></button>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Full Name *" value={g.name} onChange={e => updateGuest(i, { name: e.target.value })} />
                <Input placeholder="Phone *" value={g.phone} onChange={e => updateGuest(i, { phone: e.target.value })} />
                <Input placeholder="Email" value={g.email} onChange={e => updateGuest(i, { email: e.target.value })} />
                <Input placeholder={g.type === 'employee' ? 'Employee ID' : 'Visitor ID'} value={g.empId} onChange={e => updateGuest(i, { empId: e.target.value })} />
                <Input placeholder="Company/Dept" value={g.company} onChange={e => updateGuest(i, { company: e.target.value })} />
                <select className="border border-border rounded-md px-3 py-2 text-sm" value={g.gender} onChange={e => updateGuest(i, { gender: e.target.value as any })}>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 w-16">Pickup</label>
                  <button
                    type="button"
                    onClick={() => updateGuestPickup(i, { enabled: !g.pickup.enabled })}
                    className={`text-xs px-2 py-1 rounded border ${g.pickup.enabled ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                  >
                    {g.pickup.enabled ? 'Yes' : 'No'}
                  </button>
                </div>
                {g.pickup.enabled && (
                  <div className="grid grid-cols-2 gap-2 ml-[72px]">
                    <Input placeholder="Pickup location *" value={g.pickup.location || ''} onChange={e => updateGuestPickup(i, { location: e.target.value })} className="col-span-2" />
                    <Input type="date" value={g.pickup.date || ''} onChange={e => updateGuestPickup(i, { date: e.target.value })} />
                    <Input type="time" value={g.pickup.time || ''} onChange={e => updateGuestPickup(i, { time: e.target.value })} />
                    <select className="border border-border rounded-md px-3 py-2 text-sm" value={g.pickup.vehicle || 'Car'} onChange={e => updateGuestPickup(i, { vehicle: e.target.value })}>
                      <option>Car</option><option>Van</option><option>Bus</option><option>Auto-arrange</option>
                    </select>
                    <Input placeholder="Notes (optional)" value={g.pickup.notes || ''} onChange={e => updateGuestPickup(i, { notes: e.target.value })} />
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600 w-16">Drop</label>
                  <button
                    type="button"
                    onClick={() => updateGuestDrop(i, { enabled: !g.drop.enabled })}
                    className={`text-xs px-2 py-1 rounded border ${g.drop.enabled ? 'bg-amber-50 border-amber-300 text-amber-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
                  >
                    {g.drop.enabled ? 'Yes' : 'No'}
                  </button>
                </div>
                {g.drop.enabled && (
                  <div className="grid grid-cols-2 gap-2 ml-[72px]">
                    <Input placeholder="Drop location *" value={g.drop.location || ''} onChange={e => updateGuestDrop(i, { location: e.target.value })} className="col-span-2" />
                    <Input type="date" value={g.drop.date || ''} onChange={e => updateGuestDrop(i, { date: e.target.value })} />
                    <Input type="time" value={g.drop.time || ''} onChange={e => updateGuestDrop(i, { time: e.target.value })} />
                    <select className="border border-border rounded-md px-3 py-2 text-sm" value={g.drop.vehicle || 'Car'} onChange={e => updateGuestDrop(i, { vehicle: e.target.value })}>
                      <option>Car</option><option>Van</option><option>Bus</option><option>Auto-arrange</option>
                    </select>
                    <Input placeholder="Notes (optional)" value={g.drop.notes || ''} onChange={e => updateGuestDrop(i, { notes: e.target.value })} />
                  </div>
                )}

                {g.pickup.enabled && g.drop.enabled && g.pickup.location && g.drop.location && g.pickup.location === g.drop.location && (
                  <p className="text-xs text-amber-600 ml-[72px]">⚠ Pickup and drop location are the same</p>
                )}
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addGuest} className="gap-1"><Plus className="h-4 w-4" /> Add Guest</Button>
        </div>

        <div className="bg-card rounded-[10px] border border-border p-5">
          <h3 className="font-semibold mb-4">Rooms & Schedule</h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div><Label>Check-in Date *</Label><Input type="date" value={checkinDate} onChange={e => setCheckinDate(e.target.value)} /></div>
            <div><Label>Check-in Time</Label><Input type="time" value={checkinTime} onChange={e => setCheckinTime(e.target.value)} /></div>
            <div><Label>Check-out Date *</Label><Input type="date" value={checkoutDate} onChange={e => setCheckoutDate(e.target.value)} /></div>
            <div><Label>Check-out Time</Label><Input type="time" value={checkoutTime} onChange={e => setCheckoutTime(e.target.value)} /></div>
          </div>
          {nights > 0 && <p className="text-sm mb-4">{nights} night(s)</p>}

          {/* Full unit banners */}
          {fullUnitBanner}

          {/* Full unit toggles for multi-BHK rooms */}
          {multiBhkRooms.length > 0 && (
            <div className="mb-3">
              <Label className="text-xs text-muted-foreground">Book Full Unit</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {multiBhkRooms.map(r => (
                  <button
                    key={r.id}
                    onClick={() => toggleFullUnit(r.id)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${isFullUnitRoom(r.id) ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary border-border'}`}
                    disabled={getIndividualConflict(r.id)}
                    title={getIndividualConflict(r.id) ? 'Remove individual section selection to enable full unit booking.' : undefined}
                  >
                    Room {r.number} ({r.bhkCount}BHK)
                  </button>
                ))}
              </div>
              {multiBhkRooms.some(r => getIndividualConflict(r.id)) && (
                <p className="text-xs text-amber-600 mt-1">Remove individual section selection to enable full unit booking.</p>
              )}
            </div>
          )}

          <div className="mb-4">
            <Label>Select Sections</Label>
            <div className="max-h-48 overflow-auto border border-border rounded-md mt-1">
              {groupedSections.map(group => (
                <div key={group.bhk}>
                  <div className="px-3 py-1.5 text-xs uppercase text-gray-400 font-medium bg-muted/30 border-b border-border">
                    ── {group.bhk} BHK ──
                  </div>
                  {group.items.map(s => {
                    const locked = isFullUnitRoom(s.roomId);
                    return (
                      <label key={`${s.roomId}-${s.sectionId}`} className={`flex items-center gap-2 px-3 py-2 hover:bg-muted/50 text-sm ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                        <input
                          type="checkbox"
                          checked={selectedSections.some(ss => ss.roomId === s.roomId && ss.sectionId === s.sectionId)}
                          onChange={() => toggleSection(s.roomId, s.sectionId)}
                          disabled={locked}
                        />
                        {s.label}
                        {locked && <span className="text-xs text-primary ml-1">(Full unit)</span>}
                      </label>
                    );
                  })}
                </div>
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
                      updateGuest(i, { allocatedRoom: roomId, allocatedSection: sectionId });
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
