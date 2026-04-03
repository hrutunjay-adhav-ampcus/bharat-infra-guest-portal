import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [role, setRole] = useState<'admin' | 'manager'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(role, email, password);
    if (success) {
      toast.success('Login successful');
      navigate(role === 'admin' ? '/admin/dashboard' : '/manager/dashboard');
    } else {
      toast.error('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 bg-card rounded-[10px] border border-border">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Bharat Infra Corp</h1>
        </div>
        <p className="text-center text-muted-foreground mb-6 text-sm">Guest House Management System</p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setRole('admin')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'
            }`}
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => setRole('manager')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              role === 'manager' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground border border-border'
            }`}
          >
            Manager
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={role === 'admin' ? 'admin@company.com' : 'manager@bharatinfra.com'} required />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>
          <Button type="submit" className="w-full">Sign In</Button>
        </form>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          {role === 'admin' ? 'admin@company.com / admin123' : 'Use manager email / pass123'}
        </div>
      </div>
    </div>
  );
}
