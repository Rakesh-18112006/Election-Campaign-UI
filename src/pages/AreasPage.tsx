import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { GeographicArea, Campaign, AreaType } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatusColor } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { Plus, MapPin, Search } from 'lucide-react';

const AREA_TYPES: { value: AreaType; label: string }[] = [
  { value: 'district', label: 'District' },
  { value: 'ward', label: 'Ward' },
  { value: 'village', label: 'Village' },
  { value: 'street', label: 'Street' },
  { value: 'other', label: 'Other' },
];

export function AreasPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', areaType: 'ward' as AreaType, campaignId: '', parentAreaId: '' });

  const { data: areas, isLoading } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data } = await api.get('/areas');
      return data.areas as GeographicArea[];
    },
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await api.get('/campaigns?limit=50');
      return data.campaigns as Campaign[];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post('/areas', { ...payload, parentAreaId: payload.parentAreaId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      setCreateOpen(false);
      setForm({ name: '', areaType: 'ward', campaignId: '', parentAreaId: '' });
      toast({ title: 'Area created', variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to create area', variant: 'destructive' });
    },
  });

  const filtered = (areas || []).filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  const campaignAreas = form.campaignId ? (areas || []).filter((a) => {
    const cId = typeof a.campaignId === 'object' ? (a.campaignId as Campaign)._id : a.campaignId;
    return cId === form.campaignId;
  }) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Geographic Areas</h1>
          <p className="text-sm text-gray-500">Manage wards, villages, and geographic boundaries</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Add Area
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search areas..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !filtered.length ? (
        <div className="text-center py-16 text-gray-400">
          <MapPin className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No areas found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((area) => {
            const campaignName = typeof area.campaignId === 'object' ? (area.campaignId as Campaign).name : '';
            return (
              <Card key={area._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                      <MapPin className="h-4 w-4 text-blue-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{area.name}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{area.areaType}</p>
                      {campaignName && <p className="text-xs text-blue-600 mt-1 truncate">{campaignName}</p>}
                      <div className="mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(area.status)}`}>
                          {area.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {(area.managerIds as unknown[]).length > 0 && (
                    <p className="text-xs text-gray-400 mt-2 border-t border-gray-50 pt-2">
                      {(area.managerIds as unknown[]).length} manager(s) assigned
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Geographic Area</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Campaign</Label>
              <Select value={form.campaignId} onValueChange={(v) => setForm({ ...form, campaignId: v, parentAreaId: '' })}>
                <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                <SelectContent>
                  {(campaigns || []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Area Name</Label>
              <Input placeholder="e.g., Ward 1 - North Zone" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Area Type</Label>
              <Select value={form.areaType} onValueChange={(v) => setForm({ ...form, areaType: v as AreaType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AREA_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {campaignAreas.length > 0 && (
              <div className="space-y-1.5">
                <Label>Parent Area (Optional)</Label>
                <Select value={form.parentAreaId} onValueChange={(v) => setForm({ ...form, parentAreaId: v })}>
                  <SelectTrigger><SelectValue placeholder="No parent (top-level)" /></SelectTrigger>
                  <SelectContent>
                    {campaignAreas.map((a) => (
                      <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.name || !form.campaignId}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Area'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
