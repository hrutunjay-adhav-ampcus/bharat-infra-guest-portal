import { useApp } from '@/context/AppContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import RoomCard from '@/components/RoomCard';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Room, RoomSection } from '@/types';

export default function AdminRoomLayoutBuilder() {
  const { guestHouses, rooms, setRooms, tickets } = useApp();
  const [selectedGH, setSelectedGH] = useState(guestHouses[0]?.id || '');
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [selectedCell, setSelectedCell] = useState<{ x: number; y: number } | null>(null);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const gh = guestHouses.find(g => g.id === selectedGH);
  const floorCount = gh?.floors || 1;
  const floorRooms = rooms.filter(r => r.ghId === selectedGH && r.floor === selectedFloor);

  const [form, setForm] = useState({ number: '', bhkCount: 1, amenities: [] as string[], sectionLabels: ['A'], sectionStatuses: ['available'] as string[] });

  const AMENITIES = ['AC', 'WiFi', 'TV', 'Kitchen', 'Geyser'];
  const GRID_COLS = 4;
  const GRID_ROWS = 3;

  const getRoomAtCell = (x: number, y: number) => floorRooms.find(r => r.gridX === x && r.gridY === y);

  const selectCell = (x: number, y: number) => {
    const existing = getRoomAtCell(x, y);
    if (existing) {
      setEditingRoom(existing);
      setForm({
        number: existing.number,
        bhkCount: existing.bhkCount,
        amenities: [...existing.amenities],
        sectionLabels: existing.sections.map(s => s.label),
        sectionStatuses: existing.sections.map(s => s.status),
      });
    } else {
      setEditingRoom(null);
      setForm({ number: '', bhkCount: 1, amenities: [], sectionLabels: ['A'], sectionStatuses: ['available'] });
    }
    setSelectedCell({ x, y });
  };

  const updateBhk = (count: number) => {
    const labels = Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
    const statuses = Array.from({ length: count }, () => 'available');
    setForm({ ...form, bhkCount: count, sectionLabels: labels, sectionStatuses: statuses });
  };

  const placeRoom = () => {
    if (!selectedCell || !form.number) { toast.error('Room number required'); return; }
    const sections: RoomSection[] = form.sectionLabels.map((label, i) => ({
      sectionId: label,
      label,
      status: form.sectionStatuses[i] as any || 'available',
      guestName: null,
      bookingRef: null,
    }));
    const newRoom: Room = {
      id: 'rm' + Date.now(),
      ghId: selectedGH,
      number: form.number,
      floor: selectedFloor,
      gridX: selectedCell.x,
      gridY: selectedCell.y,
      bhkCount: form.bhkCount,
      amenities: form.amenities,
      sections,
    };
    setRooms(prev => [...prev, newRoom]);
    toast.success(`Room ${form.number} placed`);
    setSelectedCell(null);
  };

  const updateRoom = () => {
    if (!editingRoom) return;
    const sections: RoomSection[] = form.sectionLabels.map((label, i) => ({
      sectionId: label,
      label,
      status: form.sectionStatuses[i] as any || 'available',
      guestName: editingRoom.sections[i]?.guestName || null,
      bookingRef: editingRoom.sections[i]?.bookingRef || null,
    }));
    setRooms(prev => prev.map(r => r.id === editingRoom.id ? { ...r, number: form.number, bhkCount: form.bhkCount, amenities: form.amenities, sections } : r));
    toast.success(`Room ${form.number} updated`);
    setSelectedCell(null);
    setEditingRoom(null);
  };

  const removeRoom = () => {
    if (!editingRoom) return;
    setRooms(prev => prev.filter(r => r.id !== editingRoom.id));
    toast.success(`Room ${editingRoom.number} removed`);
    setSelectedCell(null);
    setEditingRoom(null);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Room Layout Builder</h1>

      <div className="mb-4">
        <Label>Select Guest House</Label>
        <select className="ml-2 border border-border rounded-md px-3 py-2 text-sm" value={selectedGH} onChange={e => { setSelectedGH(e.target.value); setSelectedFloor(1); setSelectedCell(null); }}>
          {guestHouses.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap items-center">
        {Array.from({ length: floorCount }, (_, i) => i + 1).map(f => (
          <button
            key={f}
            onClick={() => { setSelectedFloor(f); setSelectedCell(null); }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${selectedFloor === f ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}
          >
            Floor {f}
          </button>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Left Grid */}
        <div className="flex-[65]">
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: GRID_ROWS * GRID_COLS }, (_, i) => {
              const x = i % GRID_COLS;
              const y = Math.floor(i / GRID_COLS);
              const room = getRoomAtCell(x, y);
              const isSelected = selectedCell?.x === x && selectedCell?.y === y;

              if (room) {
                return (
                  <div key={i} onClick={() => selectCell(x, y)} className={isSelected ? 'ring-2 ring-blue-500 rounded-lg' : ''}>
                    <RoomCard room={room} tickets={tickets.filter(t => t.roomId === room.id)} />
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  onClick={() => selectCell(x, y)}
                  className={`rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-border'}`}
                  style={{ minHeight: '80px' }}
                >
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Form */}
        <div className="flex-[35]">
          {selectedCell ? (
            <div className="bg-card rounded-[10px] border border-border p-5">
              <h3 className="font-semibold mb-4">{editingRoom ? 'Edit Room' : 'New Room'} — Floor {selectedFloor}</h3>
              <div className="space-y-3">
                <div><Label>Room Number *</Label><Input value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} /></div>
                <div>
                  <Label>BHK Count *</Label>
                  <Input type="number" min={1} max={10} value={form.bhkCount} onChange={e => updateBhk(parseInt(e.target.value) || 1)} />
                  <span className="text-xs text-muted-foreground">{form.bhkCount} BHK</span>
                </div>
                <div>
                  <Label>Section Labels</Label>
                  {form.sectionLabels.map((label, i) => (
                    <div key={i} className="flex gap-2 mt-1">
                      <Input value={label} onChange={e => {
                        const labels = [...form.sectionLabels];
                        labels[i] = e.target.value;
                        setForm({ ...form, sectionLabels: labels });
                      }} className="w-20" />
                      <select className="border border-border rounded-md px-2 text-sm" value={form.sectionStatuses[i]} onChange={e => {
                        const statuses = [...form.sectionStatuses];
                        statuses[i] = e.target.value;
                        setForm({ ...form, sectionStatuses: statuses });
                      }}>
                        <option value="available">Available</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Amenities</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {AMENITIES.map(a => (
                      <label key={a} className="flex items-center gap-1 text-sm">
                        <input type="checkbox" checked={form.amenities.includes(a)} onChange={e => {
                          setForm({ ...form, amenities: e.target.checked ? [...form.amenities, a] : form.amenities.filter(x => x !== a) });
                        }} />
                        {a}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {editingRoom ? (
                  <>
                    <Button onClick={updateRoom}>Update Room</Button>
                    <Button variant="outline" onClick={removeRoom} className="gap-1" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                      <Trash2 className="h-3 w-3" /> Remove
                    </Button>
                  </>
                ) : (
                  <Button onClick={placeRoom}>Place Room</Button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-[10px] border border-border p-8 text-center text-muted-foreground">
              Click on a grid cell to place or edit a room
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
