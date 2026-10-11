import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn, getRoleLabel } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  MapPin,
  FileText,
  BarChart3,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Vote,
  ChevronRight,
  Bell,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['MAIN_ADMIN', 'MAYOR', 'SARPANCH', 'WARD_SUPERVISOR', 'WARD_MEMBER'] },
  { label: 'Campaigns', path: '/campaigns', icon: Vote, roles: ['MAIN_ADMIN', 'MAYOR', 'SARPANCH', 'WARD_SUPERVISOR'] },
  { label: 'Users', path: '/users', icon: Users, roles: ['MAIN_ADMIN', 'MAYOR', 'SARPANCH', 'WARD_SUPERVISOR'] },
  { label: 'Geographic Areas', path: '/areas', icon: MapPin, roles: ['MAIN_ADMIN', 'MAYOR', 'SARPANCH', 'WARD_SUPERVISOR'] },
  { label: 'Voter Records', path: '/records', icon: FileText, roles: ['MAIN_ADMIN', 'MAYOR', 'SARPANCH', 'WARD_SUPERVISOR', 'WARD_MEMBER'] },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['MAIN_ADMIN', 'MAYOR', 'SARPANCH', 'WARD_SUPERVISOR'] },
  { label: 'Audit Logs', path: '/audit-logs', icon: ClipboardList, roles: ['MAIN_ADMIN'] },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = NAV_ITEMS.filter((item) => user && item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const Sidebar = ({ mobile = false }) => (
    <div className={cn('flex flex-col h-full', mobile ? 'w-72' : 'w-64')}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-blue-800">
        <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center shrink-0">
          <Vote className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <h1 className="font-bold text-white text-sm leading-tight">Election Campaign</h1>
          <p className="text-blue-200 text-xs">Management System</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {filteredNav.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {isActive && <ChevronRight className="h-3 w-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-blue-800 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-blue-300 text-xs">{user ? getRoleLabel(user.role) : ''}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-blue-200 hover:text-white hover:bg-blue-800"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col bg-blue-900 border-r border-blue-800 shrink-0 w-64">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col bg-blue-900 h-full z-50">
            <Sidebar mobile />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <button
            className="md:hidden p-1.5 rounded-md hover:bg-gray-100 text-gray-600"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-gray-800 capitalize">
              {filteredNav.find((n) => location.pathname.startsWith(n.path))?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500">
              <Bell className="h-4 w-4" />
            </button>
            <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-7 h-7 bg-blue-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
