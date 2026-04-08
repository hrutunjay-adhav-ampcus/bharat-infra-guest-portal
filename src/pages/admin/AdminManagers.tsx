import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Settings, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdminManagers() {
  const { managers, setManagers, guestHouses, setGuestHouses } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModal, setAssignModal] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', empId: '', email: '', phone: '', password: '', assignedGHs: [] as string[] });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const filtered = managers.filter(m => m.name.toLowerCase().includes(search.toLowerCase()) || m.empId.toLowerCase().includes(search.toLowerCase()));

  // CHANGE 6: Validation helpers
  const validateEmail = (email: string) => {
    if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address (e.g. name@domain.com)';
    return '';
  };

  const validatePhone = (phone: string) => {
    if (!/^\d{10}$/.test(phone)) return 'Phone number must be exactly 10 digits';
    return '';
  };

  const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    if (!/^\d$/.test(e.key)) { e.preventDefault(); }
    if (form.phone.length >= 10 && !['Backspace', 'Delete'].includes(e.key)) { e.preventDefault(); }
  };

  const openAdd = () => {
    setEditId(null);
    const pwd = 'Pass' + Math.random().toString(36).slice(2, 8);
    setForm({ name: '', empId: '', email: '', phone: '', password: pwd, assignedGHs: [] });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (id: string) => {
    const m = managers.find(mg => mg.id === id);
    if (!m) return;
    setEditId(id);
    setForm({ name: m.name, empId: m.empId, email: m.email, phone: m.phone, password: m.password, assignedGHs: [...m.assignedGHs] });
    setFormErrors({});
    setModalOpen(true);
  };

  const save = () => {
    const errors: Record<string, string> = {};
    if (!form.name) errors.name = 'Name is required';
    if (!form.empId) errors.empId = 'Employee ID is required';
    const emailErr = validateEmail(form.email);
    if (emailErr) errors.email = emailErr;
    const phoneErr = validatePhone(form.phone);
    if (phoneErr) errors.phone = phoneErr;

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editId) {
      setManagers(prev => prev.map(m => m.id === editId ? { ...m, ...form } : m));
      toast.success('Manager updated');
    } else {
      const newId = 'mgr' + (Date.now() % 10000);
      setManagers(prev => [...prev, { id: newId, ...form, status: 'active' as const }]);
      form.assignedGHs.forEach(ghId => {
        setGuestHouses(prev => prev.map(gh => gh.id === ghId ? { ...gh, managerId: newId } : gh));
      });
      toast.success('Manager added');
    }
    setModalOpen(false);
  };

  // CHANGE 5: Delete manager
  const confirmDelete = () => {
    if (!deleteModal) return;
    const mgr = managers.find(m => m.id === deleteModal);
    if (!mgr) return;

    // Clear GH assignments
    mgr.assignedGHs.forEach(ghId => {
      setGuestHouses(prev => prev.map(gh => gh.id === ghId ? { ...gh, managerId: '' } : gh));
    });

    setManagers(prev => prev.filter(m => m.id !== deleteModal));
    toast.success(`${mgr.name} has been deleted.`);
    setDeleteModal(null);
  };

  const saveAssignments = (managerId: string, newGHs: string[]) => {
    const mgr = managers.find(m => m.id === managerId);
    if (!mgr) return;

    newGHs.forEach(ghId => {
      const gh = guestHouses.find(g => g.id === ghId);
      if (gh && gh.managerId !== managerId) {
        setManagers(prev => prev.map(m => m.id === gh.managerId ? { ...m, assignedGHs: m.assignedGHs.filter(id => id !== ghId) } : m));
        setGuestHouses(prev => prev.map(g => g.id === ghId ? { ...g, managerId } : g));
      }
    });

    const removedGHs = mgr.assignedGHs.filter(id => !newGHs.includes(id));
    removedGHs.forEach(ghId => {
      setGuestHouses(prev => prev.map(g => g.id === ghId ? { ...g, managerId: '' } : g));
    });

    setManagers(prev => prev.map(m => m.id === managerId ? { ...m, assignedGHs: newGHs } : m));
    toast.success('Assignments updated');
    setAssignModal(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Managers</h1>
        <Button onClick={openAdd} className="gap-1"><Plus className="h-4 w-4" /> Add Manager</Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search managers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-card rounded-[10px] border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Name</th>
              <th className="text-left px-4 py-3 font-medium">EMP ID</th>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">Phone</th>
              <th className="text-left px-4 py-3 font-medium">Assigned GHs</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(m => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {m.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {m.name}
                </td>
                <td className="px-4 py-3">{m.empId}</td>
                <td className="px-4 py-3">{m.email}</td>
                <td className="px-4 py-3">{m.phone}</td>
                <td className="px-4 py-3">
                  {m.assignedGHs.length > 0
                    ? m.assignedGHs.map(id => guestHouses.find(g => g.id === id)?.name).join(', ')
                    : <span className="text-amber-600 text-xs">Unassigned</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => openEdit(m.id)}><Edit className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setAssignModal(m.id)}><Settings className="h-3 w-3" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setDeleteModal(m.id)} className="hover:bg-red-50">
                      <Trash2 className="h-3 w-3 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-[10px] p-6 w-full max-w-lg">
            <h3 className="font-semibold mb-4">{editId ? 'Edit' : 'Add'} Manager</h3>
            <div className="space-y-3">
              <div>
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <Label>Employee ID *</Label>
                <Input value={form.empId} onChange={e => setForm({ ...form, empId: e.target.value })} />
                {formErrors.empId && <p className="text-red-500 text-xs mt-1">{formErrors.empId}</p>}
              </div>
              <div>
                <Label>Work Email *</Label>
                <Input
                  value={form.email}
                  onChange={e => { setForm({ ...form, email: e.target.value }); setFormErrors(prev => ({ ...prev, email: '' })); }}
                  onBlur={() => {
                    const err = validateEmail(form.email);
                    if (err) setFormErrors(prev => ({ ...prev, email: err }));
                  }}
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <Label>Phone *</Label>
                <Input
                  value={form.phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setForm({ ...form, phone: val });
                    setFormErrors(prev => ({ ...prev, phone: '' }));
                  }}
                  onKeyDown={handlePhoneKeyDown}
                  onBlur={() => {
                    const err = validatePhone(form.phone);
                    if (err) setFormErrors(prev => ({ ...prev, phone: err }));
                  }}
                  maxLength={10}
                />
                {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              </div>
              {!editId && (
                <div>
                  <Label>Temporary Password</Label>
                  <div className="flex gap-2">
                    <Input value={form.password} readOnly />
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(form.password); toast.success('Copied'); }}>Copy</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button onClick={save}>{editId ? 'Update' : 'Add'}</Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (() => {
        const mgr = managers.find(m => m.id === deleteModal);
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-card rounded-[10px] p-6 w-full max-w-md">
              <h3 className="font-semibold mb-4">Delete Manager</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Are you sure you want to delete {mgr?.name}? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button onClick={confirmDelete} style={{ backgroundColor: '#ef4444', color: 'white' }}>Confirm Delete</Button>
                <Button variant="outline" onClick={() => setDeleteModal(null)}>Cancel</Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Assign Modal */}
      {assignModal && (() => {
        const mgr = managers.find(m => m.id === assignModal);
        if (!mgr) return null;
        return (
          <AssignModal
            manager={mgr}
            guestHouses={guestHouses}
            managers={managers}
            onSave={(newGHs) => saveAssignments(assignModal, newGHs)}
            onClose={() => setAssignModal(null)}
          />
        );
      })()}
    </div>
  );
}

function AssignModal({ manager, guestHouses, managers, onSave, onClose }: any) {
  const [selected, setSelected] = useState<string[]>([...manager.assignedGHs]);

  const toggleGH = (ghId: string) => {
    setSelected(prev => prev.includes(ghId) ? prev.filter(id => id !== ghId) : [...prev, ghId]);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-[10px] p-6 w-full max-w-md">
        <h3 className="font-semibold mb-4">Manage Assignments — {manager.name}</h3>
        <div className="space-y-2">
          {guestHouses.map((gh: any) => {
            const currentMgr = managers.find((m: any) => m.id === gh.managerId && m.id !== manager.id);
            const isSelected = selected.includes(gh.id);
            return (
              <label key={gh.id} className="flex items-center gap-2 p-2 rounded border border-border cursor-pointer hover:bg-muted/50">
                <input type="checkbox" checked={isSelected} onChange={() => toggleGH(gh.id)} />
                <span className="text-sm flex-1">{gh.name}</span>
                {currentMgr && !isSelected && <span className="text-xs text-amber-600">Currently: {currentMgr.name}</span>}
                {currentMgr && isSelected && <span className="text-xs text-red-600">Will replace {currentMgr.name}</span>}
              </label>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={() => onSave(selected)}>Save</Button>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
