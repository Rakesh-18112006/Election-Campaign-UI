import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { AuditLog, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import { ClipboardList, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '30' });
      if (actionFilter) params.set('action', actionFilter);
      const { data } = await api.get(`/dashboard/audit-logs?${params}`);
      return data as { logs: AuditLog[]; total: number };
    },
  });

  const totalPages = Math.ceil((data?.total || 0) / 30);

  const ACTION_COLORS: Record<string, string> = {
    LOGIN: 'bg-blue-100 text-blue-800',
    LOGOUT: 'bg-gray-100 text-gray-700',
    CREATE_USER: 'bg-green-100 text-green-800',
    UPDATE_USER: 'bg-yellow-100 text-yellow-800',
    SUSPEND_USER: 'bg-red-100 text-red-800',
    ACTIVATE_USER: 'bg-green-100 text-green-800',
    RESET_CREDENTIALS: 'bg-orange-100 text-orange-800',
    CREATE_CAMPAIGN: 'bg-purple-100 text-purple-800',
    UPDATE_CAMPAIGN: 'bg-indigo-100 text-indigo-800',
    CREATE_AREA: 'bg-teal-100 text-teal-800',
    IMPORT_RECORDS: 'bg-blue-100 text-blue-800',
    ASSIGN_RECORD: 'bg-cyan-100 text-cyan-800',
    BULK_ASSIGN_RECORDS: 'bg-cyan-100 text-cyan-800',
    PASSWORD_CHANGE: 'bg-amber-100 text-amber-800',
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500">Complete record of all administrative actions</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Filter by action..."
          className="pl-9"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="bg-gray-50 border-b border-gray-200 py-4">
          <CardTitle className="text-sm font-semibold text-gray-700">
            {data?.total || 0} audit events
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data?.logs.length ? (
            <div className="text-center py-12 text-gray-400">
              <ClipboardList className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p>No audit logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.logs.map((log) => {
                const actor = typeof log.actorUserId === 'object' ? log.actorUserId as User : null;
                return (
                  <div key={log._id} className="px-5 py-3.5 hover:bg-gray-50 flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-gray-600">
                        {actor?.name?.[0]?.toUpperCase() || 'S'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-gray-900">
                          {actor?.name || 'System'}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                          {log.action}
                        </span>
                        <span className="text-xs text-gray-400">{log.entityType}</span>
                      </div>
                      {log.relevantMetadata && Object.keys(log.relevantMetadata).length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate font-mono">
                          {JSON.stringify(log.relevantMetadata).slice(0, 80)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 shrink-0 hidden sm:block">{formatDateTime(log.timestamp)}</span>
                  </div>
                );
              })}
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
    </div>
  );
}
