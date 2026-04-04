import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Edit, Eye, Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function AdminGuestHouses() {
  const { guestHouses, setGuestHouses, managers, setManagers, rooms } = useApp();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', city: '', address: '', floors: 1, managerId: '', status: 'active' as 'active' | 'inactive' });

  const openAdd = () => {
    setEditId(null);
    setForm({ name: '', city: '', address: '', floors: 1, managerId: '', status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const gh = guestHouses.find(g => g.id === id);
    if (!gh) return;
    setEditId(id);
    setForm({ name: gh.name, city: gh.city, address: gh.address, floors: gh.floors, managerId: gh.managerId, status: gh.status });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.name || !form.city || !form.address || !form.managerId) {
      toast.error('Fill all required fields');
      return;
    }

    if (editId) {
      const oldGH = guestHouses.find(g => g.id === editId);
      if (oldGH && oldGH.managerId !== form.managerId) {
        setManagers(prev => prev.map(m => {
          if (m.id === oldGH.managerId) return { ...m, assignedGHs: m.assignedGHs.filter(id => id !== editId) };
          if (m.id === form.managerId) return { ...m, assignedGHs: [...m.assignedGHs, editId] };
          return m;
        }));
      }
      setGuestHouses(prev => prev.map(g => g.id === editId ? { ...g, ...form } : g));
      toast.success('Guest house updated');
    } else {
      const newId = 'gh' + (Date.now() % 10000);
      setGuestHouses(prev => [...prev, { id: newId, ...form }]);
      setManagers(prev => prev.map(m => m.id === form.managerId ? { ...m, assignedGHs: [...m.assignedGHs, newId] } : m));
      toast.success('Guest house added');
    }
    setModalOpen(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Guest Houses</h1>
        <Button onClick={openAdd} className="gap-1"><Plus className="h-4 w-4" /> Add Guest House</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {guestHouses.map(gh => {
          const mgr = managers.find(m => m.id === gh.managerId);
          const ghRooms = rooms.filter(r => r.ghId === gh.id);
          return (
            <div key={gh.id} className="bg-card rounded-[10px] border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">{gh.name}</h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${gh.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {gh.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{gh.city}</p>
              <p className="text-xs text-muted-foreground mt-1">{gh.address}</p>
              <div className="flex gap-4 mt-3 text-sm">
                <span>{gh.floors} Floors</span>
                <span>{ghRooms.length} Rooms</span>
              </div>
              <div className="mt-3">
                <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: '#6366f120', color: '#6366f1' }}>
                  {mgr?.name || 'Unassigned'}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(gh.id)} className="gap-1">
                  <Edit className="h-3 w-3" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate(`/admin/room-layout-builder?ghId=${gh.id}`)}>
                  <Eye className="h-3 w-3" /> View Layout
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-[10px] p-6 w-full max-w-lg">
            <h3 className="font-semibold mb-4">{editId ? 'Edit' : 'Add'} Guest House</h3>
            <div className="space-y-3">
              <div><Label>GH Name *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>City *</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></div>
              <div><Label>Full Address *</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Number of Floors *</Label><Input type="number" min={1} max={10} value={form.floors} onChange={e => setForm({ ...form, floors: parseInt(e.target.value) || 1 })} /></div>
              <div>
                <Label>Assign Manager *</Label>
                <select className="w-full border border-border rounded-md px-3 py-2 text-sm" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
                  <option value="">Select manager</option>
                  {managers.filter(m => m.status === 'active').map(m => (
                    <option key={m.id} value={m.id}>{m.name} · {m.empId} · manages {m.assignedGHs.length} GHs</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={save}>{editId ? 'Update' : 'Add'}</Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
