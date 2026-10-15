import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { Party, PartyTheme, PartyType, User } from '@/types';
import { PARTY_OPTIONS, PARTY_THEMES, DEFAULT_CUSTOM_COLOR, buildCustomTheme } from '@/lib/partyTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { getStatusColor, formatDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { Plus, Building2, UserCircle, Eye, EyeOff, CheckCircle2, Copy } from 'lucide-react';

interface CreatedPartyResult {
  party: Party & { adminUserId: User };
}

const EMPTY_FORM = {
  partyType: '' as PartyType | '',
  partyName: '', primaryColor: DEFAULT_CUSTOM_COLOR, partyDescription: '',
  mayorName: '', mayorUsername: '', mayorPassword: '',
};

function previewTheme(partyType: PartyType | '', primaryColor: string): PartyTheme | null {
  if (!partyType) return null;
  if (partyType === 'OTHER') return /^#[0-9a-fA-F]{6}$/.test(primaryColor) ? buildCustomTheme(primaryColor) : null;
  return PARTY_THEMES[partyType];
}

function ThemeSwatches({ theme }: { theme: PartyTheme }) {
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {[theme.primary, theme.dark, theme.tint, theme.accent].map((c, i) => (
        <span key={i} className="h-3.5 w-3.5 rounded-full border border-black/10" style={{ backgroundColor: c }} />
      ))}
    </div>
  );
}

export function PartiesPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [createdResult, setCreatedResult] = useState<CreatedPartyResult | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data, isLoading } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const { data } = await api.get('/parties');
      return data as { parties: (Party & { adminUserId: User })[]; total: number };
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof form) =>
      api.post('/parties', {
        partyType: payload.partyType,
        partyDescription: payload.partyDescription,
        mayorName: payload.mayorName,
        mayorUsername: payload.mayorUsername,
        mayorPassword: payload.mayorPassword,
        ...(payload.partyType === 'OTHER' && { partyName: payload.partyName, primaryColor: payload.primaryColor }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      setCreateOpen(false);
      setCreatedResult(res.data);
      setForm(EMPTY_FORM);
      toast({ title: 'Party created', description: 'Party and Mayor account have been set up.', variant: 'success' });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast({ title: 'Error', description: msg || 'Failed to create party', variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/parties/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      toast({ title: 'Status updated', variant: 'success' });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard', variant: 'success' });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Parties</h1>
          <p className="text-sm text-gray-500">{data?.total || 0} registered parties</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Create Party
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data?.parties.length ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">No parties yet</p>
          <p className="text-sm mt-1">Create a party to assign it a Mayor and begin the campaign</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.parties.map((party) => {
            const mayor = party.adminUserId as User;
            return (
              <Card key={party._id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0"
                        style={party.theme ? { backgroundColor: party.theme.primary } : undefined}
                      >
                        <Building2 className={party.theme ? 'h-5 w-5 text-white' : 'h-5 w-5 text-blue-700'} />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-sm font-semibold text-gray-900 truncate">{party.name}</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">Created {formatDate(party.createdAt)}</p>
                        {party.theme && <div className="mt-1.5"><ThemeSwatches theme={party.theme} /></div>}
                      </div>
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(party.status)}`}>
                      {party.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {party.description && (
                    <p className="text-xs text-gray-500 line-clamp-2">{party.description}</p>
                  )}
                  {mayor && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Mayor (Party Admin)</p>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {mayor.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{mayor.name}</p>
                          <p className="text-xs text-gray-500 font-mono">@{mayor.username}</p>
                        </div>
                        <span className={`ml-auto shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-xs ${getStatusColor(mayor.status)}`}>
                          {mayor.status}
                        </span>
                      </div>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => toggleMutation.mutate(party._id)}
                    disabled={toggleMutation.isPending}
                  >
                    {party.status === 'active' ? 'Suspend Party' : 'Activate Party'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Party Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Party</DialogTitle>
            <DialogDescription>
              Set up a new political party and its Mayor (party admin) account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3 pb-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Party Details</p>
              <div className="space-y-1.5">
                <Label>Party *</Label>
                <Select value={form.partyType} onValueChange={(v) => setForm(f => ({ ...f, partyType: v as PartyType }))}>
                  <SelectTrigger id="partyType">
                    <SelectValue placeholder="Select a party" />
                  </SelectTrigger>
                  <SelectContent>
                    {PARTY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.partyType === 'OTHER' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="partyName">Party Name *</Label>
                    <Input id="partyName" placeholder="e.g. Progressive Alliance" value={form.partyName}
                      onChange={(e) => setForm(f => ({ ...f, partyName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="primaryColor">Party Colour</Label>
                    <div className="flex items-center gap-2">
                      <input id="primaryColor" type="color" value={form.primaryColor}
                        onChange={(e) => setForm(f => ({ ...f, primaryColor: e.target.value.toUpperCase() }))}
                        className="h-9 w-12 cursor-pointer rounded-md border border-gray-300 bg-white p-1" />
                      <Input value={form.primaryColor} maxLength={7} className="font-mono"
                        onChange={(e) => setForm(f => ({ ...f, primaryColor: e.target.value }))} />
                    </div>
                  </div>
                </>
              )}
              {previewTheme(form.partyType, form.primaryColor) && (
                <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-500">Theme preview</span>
                  <ThemeSwatches theme={previewTheme(form.partyType, form.primaryColor)!} />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="partyDesc">Description</Label>
                <Input id="partyDesc" placeholder="Brief description (optional)" value={form.partyDescription}
                  onChange={(e) => setForm(f => ({ ...f, partyDescription: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Mayor (Party Admin) Account</p>
              <div className="space-y-1.5">
                <Label htmlFor="mayorName">Mayor Full Name *</Label>
                <Input id="mayorName" placeholder="e.g. Rajesh Kumar" value={form.mayorName}
                  onChange={(e) => setForm(f => ({ ...f, mayorName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mayorUsername">Username *</Label>
                <Input id="mayorUsername" placeholder="e.g. mayor_rajesh" value={form.mayorUsername}
                  onChange={(e) => setForm(f => ({ ...f, mayorUsername: e.target.value.toLowerCase().replace(/\s/g, '_') }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mayorPassword">Password *</Label>
                <div className="relative">
                  <Input id="mayorPassword" type={showPassword ? 'text' : 'password'} placeholder="Min 6 characters"
                    value={form.mayorPassword} onChange={(e) => setForm(f => ({ ...f, mayorPassword: e.target.value }))} />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(p => !p)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.partyType || (form.partyType === 'OTHER' && (!form.partyName.trim() || !previewTheme('OTHER', form.primaryColor))) || !form.mayorName || !form.mayorUsername || !form.mayorPassword}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Party'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Result Dialog */}
      <Dialog open={!!createdResult} onOpenChange={() => setCreatedResult(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Party Created!
            </DialogTitle>
            <DialogDescription>
              Share these credentials with the Mayor. They will be prompted to change their password on first login.
            </DialogDescription>
          </DialogHeader>
          {createdResult && (
            <div className="space-y-3 py-2">
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase">Party</p>
                <p className="font-semibold text-gray-900">{createdResult.party.name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase">Mayor Login Credentials</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-500">Username</p>
                      <p className="font-mono text-sm font-medium text-gray-900">
                        {(createdResult.party.adminUserId as User)?.username}
                      </p>
                    </div>
                    <button onClick={() => copyToClipboard((createdResult.party.adminUserId as User)?.username || '')}
                      className="p-1.5 hover:bg-gray-200 rounded text-gray-500">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4 text-gray-400 shrink-0" />
                    <p className="text-sm text-gray-700">{(createdResult.party.adminUserId as User)?.name}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded p-2">
                Save these credentials now — the password cannot be retrieved later.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
