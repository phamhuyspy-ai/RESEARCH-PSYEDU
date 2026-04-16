
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './components/AuthGuards';
import { useAuthStore } from './stores/authStore';
import { useAppStore } from './stores/appStore';
import { useSettingsStore } from './stores/settingsStore';
import { useEffect, useState } from 'react';
import { gasService } from './services/gasService';

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
import SurveysResponses from './pages/SurveysResponses';

export default function App() {
  const authHydrated = useAuthStore((state) => state.hasHydrated);
  const appHydrated = useAppStore((state) => state.hasHydrated);
  const settingsHydrated = useSettingsStore((state) => state.hasHydrated);
  const { setSurveys } = useAppStore();
  const { updateSettings, gasUrl } = useSettingsStore();
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const syncDb = async () => {
      if (!gasUrl) {
        setIsSyncing(false);
        return;
      }
      
      try {
        const [surveysRes, settingsRes] = await Promise.all([
          gasService.getSurveys(),
          gasService.getSettings()
        ]);

        if (surveysRes.success && surveysRes.data) {
          setSurveys(surveysRes.data);
        }

        if (settingsRes.success && settingsRes.data) {
          updateSettings(settingsRes.data);
        }
      } catch (error) {
        console.error('Failed to sync DB', error);
      } finally {
        setIsSyncing(false);
      }
    };
    
    if (authHydrated && appHydrated && settingsHydrated) {
      syncDb();
    }
  }, [authHydrated, appHydrated, settingsHydrated, gasUrl, setSurveys, updateSettings]);

  const isReady = authHydrated && appHydrated && settingsHydrated && !isSyncing;

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
          <Route path="responses" element={<SurveysResponses />} />
          <Route path="builder/:id?" element={<Builder />} />
          <Route 
            path="settings" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Settings />
              </ProtectedRoute>
            } 
          />
          <Route path="results/:id" element={<SurveyResults adminView />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
