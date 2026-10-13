import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { VoterRecord, GeographicArea, Campaign, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStatusColor, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import {
  FileText, Search, Upload, UserPlus, UserCheck, MapPin, Filter, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Navigation, Loader2, Phone, Home
} from 'lucide-react';

interface GpsData {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  capturedAt: string;
}

const EMPTY_VOTER_FORM = {
  campaignId: '', geographicAreaId: '',
  name: '', voterIdRef: '', houseNumber: '', phone: '', address: '',
};

export function RecordsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_VOTER_FORM);
  const [assignOpen, setAssignOpen] = useState<VoterRecord | null>(null);
  const [visitOpen, setVisitOpen] = useState<VoterRecord | null>(null);
  const [gpsData, setGpsData] = useState<GpsData | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [importCampaignId, setImportCampaignId] = useState('');
  const [importAreaId, setImportAreaId] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isManagerOrAbove = ['MAYOR', 'CORPORATOR', 'DIVISIONAL_INCHARGE'].includes(user?.role || '');

  const { data, isLoading } = useQuery({
    queryKey: ['records', page, search, statusFilter, areaFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '15' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('recordStatus', statusFilter);
      if (areaFilter) params.set('geographicAreaId', areaFilter);
      const { data } = await api.get(`/records?${params}`);
      return data as { records: VoterRecord[]; total: number };
    },
  });

  const { data: areas } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data } = await api.get('/areas');
      return data.areas as GeographicArea[];
    },
    enabled: isManagerOrAbove,
  });

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await api.get('/campaigns?limit=50');
      return data.campaigns as Campaign[];
    },
    enabled: isManagerOrAbove,
  });

  const { data: wardMembers } = useQuery({
    queryKey: ['users-ward-members'],
    queryFn: async () => {
      const { data } = await api.get('/users?role=WARD_MEMBER&limit=100');
      return data.users as User[];
    },
    enabled: isManagerOrAbove,
  });

  const visitMutation = useMutation({
    mutationFn: ({ id, status, gps }: { id: string; status: string; gps?: GpsData }) =>
      api.post(`/records/${id}/visits`, {
        status,
        ...(gps && { latitude: gps.latitude, longitude: gps.longitude, accuracyMeters: gps.accuracyMeters, capturedAt: gps.capturedAt }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setVisitOpen(null);
      setGpsData(null);
      setGpsError('');
      toast({ title: 'Visit recorded', description: 'Status has been updated.', variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to record visit', variant: 'destructive' });
    },
  });

  const assignMutation = useMutation({
    mutationFn: ({ recordId, userId }: { recordId: string; userId: string }) =>
      api.post(`/records/${recordId}/assignments`, { assignedUserId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      setAssignOpen(null);
      toast({ title: 'Record assigned', variant: 'success' });
    },
  });

  const addMutation = useMutation({
    mutationFn: (payload: typeof addForm) => api.post('/records', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-overview'] });
      setAddOpen(false);
      setAddForm(EMPTY_VOTER_FORM);
      toast({ title: 'Voter added', description: 'The voter record has been created.', variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Could not add voter', description: msg || 'Please check the details and try again', variant: 'destructive' });
    },
  });

  const importMutation = useMutation({
    mutationFn: (formData: FormData) => api.post('/records/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      setImportOpen(false);
      setImportFile(null);
      const r = res.data.results;
      toast({ title: `Import complete: ${r.success} rows imported`, description: r.failed ? `${r.failed} rows failed` : undefined, variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Import failed', description: msg || 'Please check your file format', variant: 'destructive' });
    },
  });

  const requestGps = () => {
    setGpsLoading(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsData({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracyMeters: pos.coords.accuracy,
          capturedAt: new Date().toISOString(),
        });
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(
          err.code === 1 ? 'Location permission denied. Please enable location access.' :
          err.code === 2 ? 'Location unavailable. Please try again.' :
          'Location request timed out.'
        );
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const handleImport = () => {
    if (!importFile || !importCampaignId || !importAreaId) return;
    const fd = new FormData();
    fd.append('file', importFile);
    fd.append('campaignId', importCampaignId);
    fd.append('geographicAreaId', importAreaId);
    importMutation.mutate(fd);
  };

  const totalPages = Math.ceil((data?.total || 0) / 15);
  const addAreas = addForm.campaignId ? (areas || []).filter((a) => {
    const cId = typeof a.campaignId === 'object' ? (a.campaignId as Campaign)._id : a.campaignId;
    return cId === addForm.campaignId;
  }) : [];
  const importAreas = importCampaignId ? (areas || []).filter((a) => {
    const cId = typeof a.campaignId === 'object' ? (a.campaignId as Campaign)._id : a.campaignId;
    return cId === importCampaignId;
  }) : [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Voter Records</h1>
          <p className="text-sm text-gray-500">{user?.role === 'WARD_MEMBER' ? 'Your assigned records' : `${data?.total || 0} total records`}</p>
        </div>
        {isManagerOrAbove && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setAddOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1.5" />
              Add Voter
            </Button>
            <Button onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" />
              Import Records
            </Button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search by name or ID..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter || 'all'} onValueChange={(v) => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
            <SelectTrigger className="w-40">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="visited">Visited</SelectItem>
              <SelectItem value="not_visited">Not Visited</SelectItem>
            </SelectContent>
          </Select>
          {isManagerOrAbove && (
            <Select value={areaFilter || 'all'} onValueChange={(v) => { setAreaFilter(v === 'all' ? '' : v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                <SelectValue placeholder="Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {(areas || []).map((a) => (
                  <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.records.length ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No records found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.records.map((record) => {
                const area = record.geographicAreaId as GeographicArea;
                return (
                  <div key={record._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                        <FileText className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{record.name}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.recordStatus)}`}>
                            {record.recordStatus.replace('_', ' ')}
                          </span>
                          {record.visitCount > 0 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                              {record.visitCount} visit{record.visitCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                          {record.houseNumber && <span className="flex items-center gap-1"><Home className="h-3 w-3" />{record.houseNumber}</span>}
                          {record.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{record.phone}</span>}
                          {area?.name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{area.name}</span>}
                          {record.voterIdRef && <span className="font-mono">{record.voterIdRef}</span>}
                        </div>
                        {record.address && <p className="text-xs text-gray-400 mt-1 truncate">{record.address}</p>}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {user?.role === 'WARD_MEMBER' || isManagerOrAbove ? (
                          <button
                            onClick={() => { setVisitOpen(record); setGpsData(null); setGpsError(''); }}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Record Visit"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        ) : null}
                        {isManagerOrAbove && record.recordStatus === 'unassigned' && (
                          <button
                            onClick={() => setAssignOpen(record)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Assign"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">Page {page} of {totalPages} ({data?.total} records)</p>
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

      {/* Visit Dialog */}
      <Dialog open={!!visitOpen} onOpenChange={() => { setVisitOpen(null); setGpsData(null); setGpsError(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Visit</DialogTitle>
            <DialogDescription>
              Update the visit status for <strong>{visitOpen?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {!gpsData ? (
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
                <p className="text-sm text-blue-800 font-medium mb-2 flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Location Evidence (for Visited status)
                </p>
                <p className="text-xs text-blue-700 mb-3">
                  To mark as visited, we will request your current location as visit evidence.
                  This is voluntary — you can mark as not visited without GPS.
                </p>
                <Button variant="outline" size="sm" onClick={requestGps} disabled={gpsLoading} className="text-blue-700 border-blue-300">
                  {gpsLoading ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Getting location...</> : <><Navigation className="h-4 w-4 mr-1.5" />Get My Location</>}
                </Button>
                {gpsError && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <XCircle className="h-3.5 w-3.5" />{gpsError}
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Location captured
                </p>
                <div className="mt-2 text-xs text-green-700 space-y-1">
                  <p>Lat: {gpsData.latitude.toFixed(6)}, Lng: {gpsData.longitude.toFixed(6)}</p>
                  <p>Accuracy: ±{Math.round(gpsData.accuracyMeters)}m</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => { setVisitOpen(null); setGpsData(null); setGpsError(''); }}>Cancel</Button>
            <Button
              variant="warning"
              onClick={() => visitOpen && visitMutation.mutate({ id: visitOpen._id, status: 'not_visited' })}
              disabled={visitMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Not Visited
            </Button>
            <Button
              variant="success"
              onClick={() => visitOpen && visitMutation.mutate({ id: visitOpen._id, status: 'visited', gps: gpsData || undefined })}
              disabled={visitMutation.isPending}
            >
              {visitMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
              Mark Visited {gpsData ? '(with GPS)' : '(without GPS)'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={!!assignOpen} onOpenChange={() => setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Record</DialogTitle>
            <DialogDescription>Assign <strong>{assignOpen?.name}</strong> to a ward member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Ward Member</Label>
              <Select onValueChange={(userId) => assignOpen && assignMutation.mutate({ recordId: assignOpen._id, userId })}>
                <SelectTrigger><SelectValue placeholder="Select ward member" /></SelectTrigger>
                <SelectContent>
                  {(wardMembers || []).filter((m) => m.status === 'active').map((m) => (
                    <SelectItem key={m._id} value={m._id}>{m.name} (@{m.username})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(null)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Voter Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setAddForm(EMPTY_VOTER_FORM); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Voter</DialogTitle>
            <DialogDescription>Add a single voter record manually. For many voters at once, use Import Records.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Campaign *</Label>
              <Select value={addForm.campaignId} onValueChange={(v) => setAddForm({ ...addForm, campaignId: v, geographicAreaId: '' })}>
                <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                <SelectContent>
                  {(campaigns || []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Geographic Area *</Label>
              <Select value={addForm.geographicAreaId} onValueChange={(v) => setAddForm({ ...addForm, geographicAreaId: v })} disabled={!addForm.campaignId}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {addAreas.map((a) => (
                    <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Full Name *</Label>
              <Input placeholder="Enter voter's full name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Voter ID</Label>
                <Input placeholder="Optional" value={addForm.voterIdRef} onChange={(e) => setAddForm({ ...addForm, voterIdRef: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>House Number</Label>
                <Input placeholder="Optional" value={addForm.houseNumber} onChange={(e) => setAddForm({ ...addForm, houseNumber: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input type="tel" placeholder="Optional" value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Address</Label>
              <Input placeholder="Optional" value={addForm.address} onChange={(e) => setAddForm({ ...addForm, address: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddOpen(false); setAddForm(EMPTY_VOTER_FORM); }}>Cancel</Button>
            <Button
              onClick={() => addMutation.mutate(addForm)}
              disabled={addMutation.isPending || !addForm.name.trim() || !addForm.campaignId || !addForm.geographicAreaId}
            >
              {addMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Adding...</> : 'Add Voter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Voter Records</DialogTitle>
            <DialogDescription>Upload CSV or Excel file. Required column: name. Optional: voter_id, house_number, phone, address</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Campaign</Label>
              <Select value={importCampaignId} onValueChange={(v) => { setImportCampaignId(v); setImportAreaId(''); }}>
                <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                <SelectContent>
                  {(campaigns || []).map((c) => (
                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Geographic Area</Label>
              <Select value={importAreaId} onValueChange={setImportAreaId} disabled={!importCampaignId}>
                <SelectTrigger><SelectValue placeholder="Select area" /></SelectTrigger>
                <SelectContent>
                  {importAreas.map((a) => (
                    <SelectItem key={a._id} value={a._id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>File (CSV or Excel)</Label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {importFile ? (
                  <p className="text-sm text-blue-700 font-medium">{importFile.name}</p>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Click to select file</p>
                    <p className="text-xs text-gray-400 mt-1">CSV or Excel (.csv, .xlsx, .xls)</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImportOpen(false); setImportFile(null); }}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={importMutation.isPending || !importFile || !importCampaignId || !importAreaId}
            >
              {importMutation.isPending ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" />Importing...</> : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
