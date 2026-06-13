import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { useAppStore } from './stores/app.store.js';
import { BottomNav } from './components/nav/BottomNav.js';
import { FullPageSpinner } from './components/ui/Spinner.js';
import { LoginPage }      from './pages/LoginPage.js';
import { OnboardingPage } from './pages/OnboardingPage.js';
import { HomePage }        from './pages/HomePage.js';
import { TasksPage }       from './pages/TasksPage.js';
import { MapPage }         from './pages/MapPage.js';
import { TrajectoryPage }  from './pages/TrajectoryPage.js';
import { SettingsPage }    from './pages/SettingsPage.js';
import { AdminPage }       from './pages/AdminPage.js';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { onboardingComplete }         = useAppStore();

  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return <>{children}</>;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <main style={{ flex: 1, overflow: 'hidden' }}>{children}</main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login"       element={<LoginPage />} />
      <Route path="/onboarding"  element={<OnboardingPage />} />

      <Route path="/home" element={
        <ProtectedRoute>
          <AppLayout><HomePage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/tasks/*" element={
        <ProtectedRoute>
          <AppLayout><TasksPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/map" element={
        <ProtectedRoute>
          <AppLayout><MapPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/trajectory" element={
        <ProtectedRoute>
          <AppLayout><TrajectoryPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout><SettingsPage /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/admin" element={
        <AdminRoute>
          <AppLayout><AdminPage /></AppLayout>
        </AdminRoute>
      } />

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
