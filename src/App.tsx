
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/AuthGuards';
import { useAuthStore } from './stores/authStore';
import { useAppStore } from './stores/appStore';
import { useSettingsStore } from './stores/settingsStore';
import { useEffect } from 'react';

// Lazy load pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Builder from './pages/Builder';
import SurveyRunner from './pages/SurveyRunner';
import SurveyResults from './pages/SurveyResults';
import PublicPortal from './pages/PublicPortal';
import AdminLayout from './layouts/AdminLayout';
import Settings from './pages/Settings';
import Surveys from './pages/Surveys';

export default function App() {
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const appHydrated = useAppStore((state) => state.hasHydrated);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);

  const isReady = authHydrated && appHydrated && settingsHydrated;

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Đang khởi tạo hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicPortal />} />
        <Route path="/survey/:code" element={<SurveyRunner />} />
        <Route path="/results/:submissionId" element={<SurveyResults />} />

        {/* Admin Routes */}
        <Route
          path="/admin/login"
          element={
            <PublicOnlyRoute>
              <Login />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="surveys" element={<Surveys />} />
          <Route path="builder/:id?" element={<Builder />} />
          <Route path="settings" element={<Settings />} />
          <Route path="results/:id" element={<SurveyResults adminView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
