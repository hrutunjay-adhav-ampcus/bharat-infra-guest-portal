import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminSettings() {
  const { settings, setSettings } = useApp();
  const [form, setForm] = useState({ ...settings });
  const [showPass, setShowPass] = useState(false);

  const save = () => {
    setSettings(form);
    toast.success('Settings saved');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-card rounded-[10px] border border-border p-6 max-w-2xl">
        <div className="space-y-4">
          <div><Label>Company Name</Label><Input value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Default Check-in Time</Label><Input type="time" value={form.checkinTime} onChange={e => setForm({ ...form, checkinTime: e.target.value })} /></div>
            <div><Label>Default Check-out Time</Label><Input type="time" value={form.checkoutTime} onChange={e => setForm({ ...form, checkoutTime: e.target.value })} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Cleaning Buffer (minutes)</Label><Input type="number" value={form.cleaningBufferMinutes} onChange={e => setForm({ ...form, cleaningBufferMinutes: parseInt(e.target.value) || 0 })} /></div>
            <div><Label>Booking Expiry (hours)</Label><Input type="number" value={form.bookingExpiryHours} onChange={e => setForm({ ...form, bookingExpiryHours: parseInt(e.target.value) || 4 })} /></div>
          </div>

          <hr className="border-border" />
          <h3 className="font-semibold">SMTP Configuration</h3>
          <div><Label>SMTP From Email</Label><Input value={form.smtpEmail} onChange={e => setForm({ ...form, smtpEmail: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>SMTP Host</Label><Input value={form.smtpHost} onChange={e => setForm({ ...form, smtpHost: e.target.value })} /></div>
            <div><Label>SMTP Port</Label><Input type="number" value={form.smtpPort} onChange={e => setForm({ ...form, smtpPort: parseInt(e.target.value) || 587 })} /></div>
          </div>
          <div><Label>SMTP Username</Label><Input value={form.smtpUser} onChange={e => setForm({ ...form, smtpUser: e.target.value })} /></div>
          <div>
            <Label>SMTP Password</Label>
            <div className="relative">
              <Input type={showPass ? 'text' : 'password'} value={form.smtpPass} onChange={e => setForm({ ...form, smtpPass: e.target.value })} />
              <button className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <hr className="border-border" />
          <div>
            <Label>Dos & Don'ts</Label>
            <textarea
              className="w-full border border-border rounded-md p-3 text-sm min-h-[120px] mt-1"
              value={form.dosAndDonts}
              onChange={e => setForm({ ...form, dosAndDonts: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button variant="outline" onClick={() => toast.success('SMTP connection successful')}>Test SMTP Connection</Button>
          <Button onClick={save}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
