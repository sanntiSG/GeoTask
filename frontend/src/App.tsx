import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.js';
import { useAppStore } from './stores/app.store.js';
import { useGeolocationSync } from './hooks/useGeolocation.js';
import { useNotifications } from './hooks/useNotifications.js';
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
  // Sync position on every authenticated route so proximity detection works
  // regardless of which tab the user is on (was only active on HomePage before).
  useGeolocationSync();

  // Keep the push subscription alive: re-subscribe on mount, on focus, and whenever
  // the Service Worker is replaced (HMR in dev or browser update in prod).
  // ensureSubscribed() is idempotent — reuses the existing browser subscription and
  // only posts to the server when needed, so calling it often is safe.
  const { ensureSubscribed } = useNotifications();
  useEffect(() => {
    ensureSubscribed();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') ensureSubscribed();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // controllerchange fires when a new SW takes control (HMR, skipWaiting, update).
    // Re-subscribe immediately so the new SW's PushManager owns the active subscription.
    const swContainer = 'serviceWorker' in navigator ? navigator.serviceWorker : null;
    const handleController = () => ensureSubscribed();
    swContainer?.addEventListener('controllerchange', handleController);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      swContainer?.removeEventListener('controllerchange', handleController);
    };
  }, [ensureSubscribed]);

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
