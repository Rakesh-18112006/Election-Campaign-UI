import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/layouts/ProtectedRoute';
import { AppLayout } from '@/layouts/AppLayout';
import { Toaster } from '@/components/ui/toaster';

import { LoginPage } from '@/pages/auth/LoginPage';
import { ChangePasswordPage } from '@/pages/auth/ChangePasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { UsersPage } from '@/pages/UsersPage';
import { CampaignsPage } from '@/pages/CampaignsPage';
import { AreasPage } from '@/pages/AreasPage';
import { RecordsPage } from '@/pages/RecordsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

const MANAGER_ROLES = ['MAIN_ADMIN', 'MAYOR', 'SARPANCH', 'WARD_SUPERVISOR'] as const;

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route
                        path="/users"
                        element={
                          <ProtectedRoute allowedRoles={[...MANAGER_ROLES]}>
                            <UsersPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/campaigns"
                        element={
                          <ProtectedRoute allowedRoles={[...MANAGER_ROLES]}>
                            <CampaignsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/areas"
                        element={
                          <ProtectedRoute allowedRoles={[...MANAGER_ROLES]}>
                            <AreasPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/records" element={<RecordsPage />} />
                      <Route
                        path="/reports"
                        element={
                          <ProtectedRoute allowedRoles={[...MANAGER_ROLES]}>
                            <ReportsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/audit-logs"
                        element={
                          <ProtectedRoute allowedRoles={['MAIN_ADMIN']}>
                            <AuditLogsPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
