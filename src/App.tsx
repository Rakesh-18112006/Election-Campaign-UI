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
import { PartiesPage } from '@/pages/PartiesPage';
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

const PARTY_ROLES = ['MAYOR', 'CORPORATOR', 'DIVISIONAL_INCHARGE', 'WARD_MEMBER'] as const;
const MANAGER_ROLES = ['MAYOR', 'CORPORATOR', 'DIVISIONAL_INCHARGE'] as const;

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
                      {/* MAIN_ADMIN: parties + audit logs only */}
                      <Route
                        path="/parties"
                        element={
                          <ProtectedRoute allowedRoles={['MAIN_ADMIN']}>
                            <PartiesPage />
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

                      {/* Party roles */}
                      <Route
                        path="/dashboard"
                        element={
                          <ProtectedRoute allowedRoles={[...PARTY_ROLES]}>
                            <DashboardPage />
                          </ProtectedRoute>
                        }
                      />
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
