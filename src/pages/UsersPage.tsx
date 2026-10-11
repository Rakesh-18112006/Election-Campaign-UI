import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { User, UserRole } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getRoleBadgeColor, getRoleLabel, getStatusColor, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { Plus, Search, UserCircle, Key, Ban, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'MAYOR', label: 'Mayor' },
  { value: 'SARPANCH', label: 'Sarpanch' },
  { value: 'WARD_SUPERVISOR', label: 'Ward Supervisor' },
  { value: 'WARD_MEMBER', label: 'Ward Member' },
];

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [form, setForm] = useState({ name: '', username: '', password: '', role: '' as UserRole });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: async () => {
      const { data } = await api.get(`/users?page=${page}&limit=15`);
      return data as { users: User[]; total: number };
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/users', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateOpen(false);
      setForm({ name: '', username: '', password: '', role: '' as UserRole });
      toast({ title: 'User created', description: 'New user account has been created.', variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to create user', variant: 'destructive' });
    },
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'suspend' | 'activate' }) =>
      api.post(`/users/${id}/suspend`, { action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Account updated', variant: 'success' });
    },
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.post(`/users/${id}/reset-credentials`, { newPassword: password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setResetOpen(null);
      setNewPassword('');
      toast({ title: 'Password reset', description: 'Credentials have been reset.', variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to reset', variant: 'destructive' });
    },
  });

  const filteredUsers = (data?.users || []).filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil((data?.total || 0) / 15);

  const availableRoles = currentUser?.role === 'MAIN_ADMIN' ? ROLE_OPTIONS : ROLE_OPTIONS.filter((r) => r.value === 'WARD_MEMBER');

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500">Manage accounts and access permissions</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          Add User
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search users..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="px-5 py-4 bg-gray-50 border-b border-gray-200">
          <CardTitle className="text-sm font-semibold text-gray-700">All Users ({data?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-100">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Role</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                            {u.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-400">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(u.status)}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-500 hidden lg:table-cell">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setResetOpen(u)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Reset Password"
                          >
                            <Key className="h-4 w-4" />
                          </button>
                          {u._id !== currentUser?._id && (
                            <button
                              onClick={() => suspendMutation.mutate({ id: u._id, action: u.status === 'active' ? 'suspend' : 'activate' })}
                              className={`p-1.5 rounded transition-colors ${u.status === 'active' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                              title={u.status === 'active' ? 'Suspend' : 'Activate'}
                            >
                              {u.status === 'active' ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="Enter full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input placeholder="Enter username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                <SelectContent>
                  {availableRoles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Temporary Password</Label>
              <Input
                type="password"
                placeholder="Set temporary password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-xs text-gray-400">User will be required to change this on first login</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.name || !form.username || !form.password || !form.role}
            >
              {createMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetOpen} onOpenChange={() => setResetOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-gray-600">
              Reset password for <strong>{resetOpen?.name}</strong> ({resetOpen?.username})
            </p>
            <div className="space-y-1.5">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(null)}>Cancel</Button>
            <Button
              onClick={() => resetOpen && resetMutation.mutate({ id: resetOpen._id, password: newPassword })}
              disabled={resetMutation.isPending || !newPassword}
            >
              {resetMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
