import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats, AuditLog, User } from '@/types';
import { formatDateTime, getRoleLabel } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Users, Vote, MapPin, FileText, CheckCircle2, AlertCircle, TrendingUp, Clock } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, subtitle, icon: Icon, color, bgColor }: StatCardProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg ${bgColor}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const COLORS = ['#1d4ed8', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-overview'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/overview');
      return data.stats as DashboardStats;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data;
  if (!stats) return null;

  const recordsChartData = [
    { name: 'Visited', value: stats.records.visited },
    { name: 'Not Visited', value: stats.records.notVisited },
    { name: 'Assigned', value: stats.records.assigned },
    { name: 'Unassigned', value: stats.records.unassigned },
  ];

  const userChartData = [
    { name: 'Active', value: stats.users.active },
    { name: 'Suspended', value: stats.users.suspended },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-800 rounded-xl p-6 text-white">
        <h1 className="text-xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-blue-200 text-sm mt-1">{getRoleLabel(user?.role || '')} — Election Campaign Management System</p>
        <div className="mt-3 flex items-center gap-2 text-blue-100 text-sm">
          <TrendingUp className="h-4 w-4" />
          <span>Overall completion: <strong className="text-white">{stats.records.completionRate}%</strong></span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Records"
          value={stats.records.total}
          subtitle={`${stats.records.assigned} assigned`}
          icon={FileText}
          color="text-blue-700"
          bgColor="bg-blue-50"
        />
        <StatCard
          title="Visited"
          value={stats.records.visited}
          subtitle={`${stats.records.completionRate}% complete`}
          icon={CheckCircle2}
          color="text-green-600"
          bgColor="bg-green-50"
        />
        <StatCard
          title="Pending"
          value={stats.records.assigned + stats.records.notVisited}
          subtitle={`${stats.records.unassigned} unassigned`}
          icon={AlertCircle}
          color="text-amber-600"
          bgColor="bg-amber-50"
        />
        {user?.role !== 'WARD_MEMBER' && (
          <StatCard
            title="Active Campaigns"
            value={stats.campaigns.active}
            subtitle={`of ${stats.campaigns.total} total`}
            icon={Vote}
            color="text-purple-600"
            bgColor="bg-purple-50"
          />
        )}
        {user?.role === 'WARD_MEMBER' && (
          <StatCard
            title="Not Visited"
            value={stats.records.notVisited}
            icon={Clock}
            color="text-red-600"
            bgColor="bg-red-50"
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Records Status Chart */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Records Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={recordsChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {recordsChartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="space-y-4">
          {user?.role !== 'WARD_MEMBER' && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">User Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={userChartData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                      {userChartData.map((_, index) => (
                        <Cell key={index} fill={index === 0 ? '#22c55e' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Legend iconSize={8} />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-around mt-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-green-600">{stats.users.active}</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-500">{stats.users.suspended}</p>
                    <p className="text-xs text-gray-500">Suspended</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progress Card */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Completion Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Visited</span>
                    <span className="font-semibold text-gray-900">{stats.records.completionRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${stats.records.completionRate}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Assigned</span>
                    <span className="font-semibold text-gray-900">
                      {stats.records.total > 0 ? Math.round(((stats.records.assigned + stats.records.visited + stats.records.notVisited) / stats.records.total) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${stats.records.total > 0 ? Math.round(((stats.records.assigned + stats.records.visited + stats.records.notVisited) / stats.records.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Activity */}
      {user?.role !== 'WARD_MEMBER' && stats.recentActivity.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recentActivity.slice(0, 8).map((log: AuditLog) => (
                <div key={log._id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-blue-700 text-xs font-bold">
                      {typeof log.actorUserId === 'object' ? (log.actorUserId as User).name?.[0] : 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">
                      <span className="font-medium">
                        {typeof log.actorUserId === 'object' ? (log.actorUserId as User).name : 'Unknown'}
                      </span>
                      {' · '}
                      <Badge variant="secondary" className="text-xs px-1.5 py-0 font-mono">{log.action}</Badge>
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{formatDateTime(log.timestamp)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
