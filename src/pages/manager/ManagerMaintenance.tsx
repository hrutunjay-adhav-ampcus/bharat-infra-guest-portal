import { useApp } from '@/context/AppContext';
import StatCard from '@/components/StatCard';
import { CategoryBadge, PriorityBadge } from '@/components/StatusBadges';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wrench, Clock, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ManagerMaintenance() {
  const { selectedGHId, tickets, setTickets, rooms, setRooms } = useApp();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [createModal, setCreateModal] = useState(false);
  const [resolveModal, setResolveModal] = useState<string | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [newTicket, setNewTicket] = useState({ roomId: '', sectionId: '', category: 'Electrical', priority: 'Medium' as 'Low' | 'Medium' | 'High', description: '', blockBookings: true });

  const ghTickets = tickets.filter(t => t.ghId === selectedGHId);
  const ghRooms = rooms.filter(r => r.ghId === selectedGHId);

  const filtered = ghTickets
    .filter(t => statusFilter === 'all' || t.status === statusFilter)
    .filter(t => categoryFilter === 'all' || t.category === categoryFilter);

  const categories = Array.from(new Set(ghTickets.map(t => t.category)));
  const CATEGORIES = ['Electrical', 'Plumbing', 'AC/HVAC', 'Furniture', 'Post-checkout Cleaning', 'Pest Control', 'Appliances', 'Other'];

  const openCount = ghTickets.filter(t => t.status === 'open').length;
  const inProgressCount = ghTickets.filter(t => t.status === 'in_progress').length;
  const resolvedThisMonth = ghTickets.filter(t => t.status === 'resolved').length;
  const avgResolution = (() => {
    const resolved = ghTickets.filter(t => t.resolutionHours);
    return resolved.length > 0 ? Math.round(resolved.reduce((a, t) => a + (t.resolutionHours || 0), 0) / resolved.length) : 0;
  })();

  const startWork = (id: string) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'in_progress' as const } : t));
    toast.success('Ticket marked in progress');
  };

  const resolve = () => {
    if (!resolveModal || !resolveNote) { toast.error('Resolution note required'); return; }
    const ticket = tickets.find(t => t.id === resolveModal);
    if (!ticket) return;
    setTickets(prev => prev.map(t => t.id === resolveModal ? {
      ...t, status: 'resolved' as const, resolvedAt: new Date().toISOString().split('T')[0],
      resolutionHours: 1, resolutionNote: resolveNote
    } : t));
    setRooms(prev => prev.map(room => room.id === ticket.roomId ? {
      ...room, sections: room.sections.map(s => s.sectionId === ticket.sectionId ? { ...s, status: 'available' as const } : s)
    } : room));
    toast.success(`Room ${rooms.find(r => r.id === ticket.roomId)?.number} Section ${ticket.sectionId} is now available`);
    setResolveModal(null);
    setResolveNote('');
  };

  const createTicket = () => {
    if (!newTicket.roomId || !newTicket.description) { toast.error('Fill required fields'); return; }
    const room = rooms.find(r => r.id === newTicket.roomId);
    const sectionId = newTicket.sectionId || room?.sections[0]?.sectionId || 'A';
    const tk = {
      id: 'TK' + Date.now(),
      ghId: selectedGHId,
      roomId: newTicket.roomId,
      sectionId,
      floor: room?.floor || 1,
      category: newTicket.category,
      priority: newTicket.priority,
      description: newTicket.description,
      status: 'open' as const,
      reportedAt: new Date().toISOString().split('T')[0],
    };
    setTickets(prev => [...prev, tk]);
    if (newTicket.blockBookings) {
      setRooms(prev => prev.map(r => r.id === newTicket.roomId ? {
        ...r, sections: r.sections.map(s => s.sectionId === sectionId ? { ...s, status: 'maintenance' as const } : s)
      } : r));
    }
    toast.success('Maintenance ticket created');
    setCreateModal(false);
    setNewTicket({ roomId: '', sectionId: '', category: 'Electrical', priority: 'Medium', description: '', blockBookings: true });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <Button onClick={() => setCreateModal(true)} className="gap-1"><Plus className="h-4 w-4" /> Mark for Maintenance</Button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Open" value={openCount} icon={AlertTriangle} color="#ef4444" />
        <StatCard title="In Progress" value={inProgressCount} icon={Clock} color="#f59e0b" />
        <StatCard title="Resolved This Month" value={resolvedThisMonth} icon={CheckCircle} color="#22c55e" />
        <StatCard title="Avg Resolution (hrs)" value={avgResolution} icon={Wrench} color="#6366f1" />
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex gap-2">
          {['all', 'open', 'in_progress', 'resolved'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary border border-border'}`}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <select className="border border-border rounded-md px-3 py-1 text-sm" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
          <option value="all">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(t => {
          const room = rooms.find(r => r.id === t.roomId);
          return (
            <div key={t.id} className="bg-card rounded-[10px] border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold">Room {room?.number}-{t.sectionId}</span>
                  <span className="text-xs text-muted-foreground ml-2">Floor {t.floor}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${t.status === 'open' ? 'bg-red-100 text-red-700' : t.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex gap-2 mb-2">
                <CategoryBadge category={t.category} />
                <PriorityBadge priority={t.priority} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{t.description}</p>
              <p className="text-xs text-muted-foreground mb-3">Reported: {t.reportedAt}</p>
              {t.status === 'open' && <Button size="sm" onClick={() => startWork(t.id)}>Start Work</Button>}
              {t.status === 'in_progress' && <Button size="sm" onClick={() => { setResolveModal(t.id); setResolveNote(''); }} style={{ backgroundColor: '#22c55e' }}>Mark Resolved</Button>}
              {t.status === 'resolved' && t.resolutionNote && <p className="text-xs text-muted-foreground">Note: {t.resolutionNote}</p>}
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      {createModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-[10px] p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Mark for Maintenance</h3>
            <div className="space-y-3">
              <div>
                <Label>Room/Section *</Label>
                <select className="w-full border border-border rounded-md px-3 py-2 text-sm" value={`${newTicket.roomId}|${newTicket.sectionId}`}
                  onChange={e => { const [rid, sid] = e.target.value.split('|'); setNewTicket({ ...newTicket, roomId: rid, sectionId: sid }); }}>
                  <option value="|">Select</option>
                  {ghRooms.map(r => r.sections.map(s => (
                    <option key={`${r.id}-${s.sectionId}`} value={`${r.id}|${s.sectionId}`}>
                      Room {r.number}{r.bhkCount > 1 ? `-${s.label}` : ''} ({s.status})
                    </option>
                  )))}
                </select>
              </div>
              <div>
                <Label>Category *</Label>
                <select className="w-full border border-border rounded-md px-3 py-2 text-sm" value={newTicket.category} onChange={e => setNewTicket({ ...newTicket, category: e.target.value })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label>Priority *</Label>
                <div className="flex gap-4">
                  {(['Low', 'Medium', 'High'] as const).map(p => (
                    <label key={p} className="flex items-center gap-1 text-sm">
                      <input type="radio" name="priority" checked={newTicket.priority === p} onChange={() => setNewTicket({ ...newTicket, priority: p })} />
                      {p}
                    </label>
                  ))}
                </div>
              </div>
              <div><Label>Description *</Label><textarea className="w-full border border-border rounded-md p-2 text-sm min-h-[80px]" value={newTicket.description} onChange={e => setNewTicket({ ...newTicket, description: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newTicket.blockBookings} onChange={e => setNewTicket({ ...newTicket, blockBookings: e.target.checked })} />
                Block from bookings
              </label>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={createTicket}>Create Ticket</Button>
              <Button variant="outline" onClick={() => setCreateModal(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-[10px] p-6 w-full max-w-md">
            <h3 className="font-semibold mb-4">Mark as Resolved</h3>
            <Label>Resolution Note *</Label>
            <textarea className="w-full border border-border rounded-md p-2 text-sm min-h-[80px] mt-1" value={resolveNote} onChange={e => setResolveNote(e.target.value)} />
            <div className="flex gap-2 mt-4">
              <Button onClick={resolve} disabled={!resolveNote} style={{ backgroundColor: '#22c55e' }}>Confirm</Button>
              <Button variant="outline" onClick={() => setResolveModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
