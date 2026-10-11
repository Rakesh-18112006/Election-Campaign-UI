import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { Campaign, GeographicArea } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const COLORS = ['#1d4ed8', '#22c55e', '#f59e0b', '#ef4444'];

export function ReportsPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState('');

  const { data: campaigns } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data } = await api.get('/campaigns?limit=50');
      return data.campaigns as Campaign[];
    },
  });

  const { data: campaignStats } = useQuery({
    queryKey: ['campaign-stats', selectedCampaignId],
    queryFn: async () => {
      const { data } = await api.get(`/dashboard/campaigns/${selectedCampaignId}`);
      return data;
    },
    enabled: !!selectedCampaignId,
  });

  const areaData: { name: string; total: number; visited: number; pending: number; completionRate: number }[] = (campaignStats?.stats?.byArea || []).map((a: { areaName: string; total: number; visited: number }) => ({
    name: a.areaName,
    total: a.total,
    visited: a.visited,
    pending: a.total - a.visited,
    completionRate: a.total > 0 ? Math.round((a.visited / a.total) * 100) : 0,
  }));

  const statusData = campaignStats ? [
    { name: 'Visited', value: campaignStats.stats?.byStatus?.visited || 0 },
    { name: 'Not Visited', value: campaignStats.stats?.byStatus?.not_visited || 0 },
    { name: 'Assigned', value: campaignStats.stats?.byStatus?.assigned || 0 },
    { name: 'Unassigned', value: campaignStats.stats?.byStatus?.unassigned || 0 },
  ] : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">Campaign progress and field activity overview</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5">
          <div className="max-w-sm space-y-1.5">
            <Label>Select Campaign</Label>
            <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
              <SelectTrigger><SelectValue placeholder="Choose a campaign to view report" /></SelectTrigger>
              <SelectContent>
                {(campaigns || []).map((c) => (
                  <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedCampaignId ? (
        <div className="text-center py-16 text-gray-400">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Select a campaign to view reports</p>
        </div>
      ) : !campaignStats ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Records', value: campaignStats.stats?.total || 0, color: 'text-blue-700', bg: 'bg-blue-50' },
              { label: 'Visited', value: campaignStats.stats?.byStatus?.visited || 0, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Not Visited', value: campaignStats.stats?.byStatus?.not_visited || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Unassigned', value: campaignStats.stats?.byStatus?.unassigned || 0, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((s) => (
              <Card key={s.label} className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown Pie */}
            <Card className="border-0 shadow-sm">
              <CardHeader><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Area Completion */}
            {areaData.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader><CardTitle className="text-base">Progress by Area</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={areaData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
                      <Tooltip />
                      <Bar dataKey="visited" fill="#22c55e" name="Visited" radius={[0, 3, 3, 0]} />
                      <Bar dataKey="pending" fill="#e2e8f0" name="Pending" radius={[0, 3, 3, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Area Details Table */}
          {areaData.length > 0 && (
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="bg-gray-50 border-b border-gray-200 py-4">
                <CardTitle className="text-sm font-semibold text-gray-700">Area-wise Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-gray-100">
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Area</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Total</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Visited</th>
                        <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Completion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {areaData.map((a) => (
                        <tr key={a.name} className="hover:bg-gray-50">
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">{a.name}</td>
                          <td className="px-5 py-3 text-sm text-gray-600 text-right">{a.total}</td>
                          <td className="px-5 py-3 text-sm text-green-600 font-medium text-right">{a.visited}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${a.completionRate}%` }} />
                              </div>
                              <span className="text-sm font-medium text-gray-700 w-9 text-right">{a.completionRate}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
