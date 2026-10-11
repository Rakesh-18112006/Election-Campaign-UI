import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Vote, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ChangePasswordPage() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      await refreshUser();
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-700 rounded-2xl mb-4 shadow-lg">
            <Vote className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Change Password</h1>
          {user?.mustChangePassword && (
            <div className="mt-3 flex items-center gap-2 justify-center bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              You must change your password before continuing
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!user?.mustChangePassword && (
              <div className="space-y-1.5">
                <Label>Current Password</Label>
                <Input
                  type="password"
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required={!user?.mustChangePassword}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Passwords match
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </span>
              ) : (
                'Update Password'
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
