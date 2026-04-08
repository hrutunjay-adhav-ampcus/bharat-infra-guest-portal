import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface ResetPasswordModalProps {
  onClose: () => void;
}

const PASSWORD_REGEX = /^(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

export default function ResetPasswordModal({ onClose }: ResetPasswordModalProps) {
  const { user, managers, setManagers } = useApp();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isAdmin = user?.role === 'admin';
  const currentManager = !isAdmin ? managers.find(m => m.id === user?.userId) : null;
  const userEmail = isAdmin ? 'admin@company.com' : currentManager?.email || '';

  const getStoredPassword = () => {
    if (isAdmin) return 'admin123';
    return currentManager?.password || '';
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentPassword !== getStoredPassword()) {
      errs.currentPassword = 'Current password incorrect';
    }

    if (newPassword.length < 8) {
      errs.newPassword = 'Password must be at least 8 characters';
    } else if (!/[0-9]/.test(newPassword)) {
      errs.newPassword = 'Must contain at least one number';
    } else if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      errs.newPassword = 'Must contain at least one special character';
    }

    if (confirmPassword !== newPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    if (isAdmin) {
      // For admin, we store updated password in localStorage
      localStorage.setItem('ghms_admin_password', newPassword);
    } else if (currentManager) {
      setManagers(prev => prev.map(m => m.id === currentManager.id ? { ...m, password: newPassword } : m));
    }

    setSuccess(true);
    toast.success(`A confirmation email has been sent to ${userEmail}`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-[10px] p-6 w-full max-w-md">
        <h3 className="font-semibold mb-4">Reset Password</h3>

        {success ? (
          <div>
            <div className="p-4 rounded-lg mb-4" style={{ backgroundColor: '#E1F5EE' }}>
              <p className="text-sm font-medium" style={{ color: '#085041' }}>Password has been reset successfully.</p>
            </div>
            <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <Label>Current Password *</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => { setCurrentPassword(e.target.value); setErrors(prev => ({ ...prev, currentPassword: '' })); }}
                  placeholder="Enter current password"
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
            </div>
            <div>
              <Label>New Password *</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setErrors(prev => ({ ...prev, newPassword: '' })); }}
                  placeholder="Min 8 chars, 1 number, 1 special char"
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowNew(!showNew)}>
                  {showNew ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>}
            </div>
            <div>
              <Label>Confirm New Password *</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setErrors(prev => ({ ...prev, confirmPassword: '' })); }}
                  placeholder="Re-enter new password"
                />
                <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleSubmit}>Reset Password</Button>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
