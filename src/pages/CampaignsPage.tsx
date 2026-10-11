import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Campaign, CampaignStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatusColor, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { Plus, Vote, Calendar, Edit2 } from 'lucide-react';

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Campaign | null>(null);
  const [form, setForm] = useState({ name: '', description: '', status: 'draft' as CampaignStatus, startDate: '', endDate: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await api.get('/campaigns?limit=50');
      return data.campaigns as Campaign[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) => api.post('/campaigns', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setCreateOpen(false);
      setForm({ name: '', description: '', status: 'draft', startDate: '', endDate: '' });
      toast({ title: 'Campaign created', variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to create campaign', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & typeof form) => api.patch(`/campaigns/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setEditTarget(null);
      toast({ title: 'Campaign updated', variant: 'success' });
    },
  });

  const openEdit = (c: Campaign) => {
    setEditTarget(c);
    setForm({
      name: c.name,
      description: c.description || '',
      status: c.status,
      startDate: c.startDate ? c.startDate.slice(0, 10) : '',
      endDate: c.endDate ? c.endDate.slice(0, 10) : '',
    });
  };

  const CampaignForm = () => (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Campaign Name</Label>
        <Input placeholder="Enter campaign name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input placeholder="Brief description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as CampaignStatus })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Start Date</Label>
          <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>End Date</Label>
          <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-sm text-gray-500">Manage election campaigns and their configurations</p>
        </div>
        <Button onClick={() => { setCreateOpen(true); setForm({ name: '', description: '', status: 'draft', startDate: '', endDate: '' }); }}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.length ? (
        <div className="text-center py-16 text-gray-400">
          <Vote className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No campaigns yet</p>
          <p className="text-sm mt-1">Create your first election campaign</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map((c) => (
            <Card key={c._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                      <Vote className="h-4 w-4 text-blue-700" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{c.name}</CardTitle>
                      {c.description && <CardDescription className="text-xs mt-0.5 line-clamp-2">{c.description}</CardDescription>}
                    </div>
                  </div>
                  <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded shrink-0">
                    <Edit2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(c.status)}`}>
                    {c.status}
                  </span>
                </div>
                {(c.startDate || c.endDate) && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5" />
                    {c.startDate && formatDate(c.startDate)}
                    {c.startDate && c.endDate && ' – '}
                    {c.endDate && formatDate(c.endDate)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
          <CampaignForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.name}>
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Campaign</DialogTitle></DialogHeader>
          <CampaignForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
            <Button
              onClick={() => editTarget && updateMutation.mutate({ id: editTarget._id, ...form })}
              disabled={updateMutation.isPending || !form.name}
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
