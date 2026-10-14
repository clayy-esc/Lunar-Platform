import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import { DashboardRoot } from './pages/dashboard/DashboardRoot';
import { FormBuilderPage } from './pages/dashboard/FormBuilderPage';
import { LogicFlowPage } from './pages/dashboard/LogicFlowPage';
import { PreviewPage } from './pages/dashboard/PreviewPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { SubmissionsPage } from './pages/dashboard/SubmissionsPage';
import { ThemePage } from './pages/dashboard/ThemePage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { PublicSurveyPage } from './pages/public/PublicSurveyPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Public Respondent Route */}
            <Route path="/s/:slug" element={<PublicSurveyPage />} />

            {/* Protected Dashboard Routes */}
            <Route path="/dashboard" element={<ProtectedRoute />}>
              <Route index element={<DashboardRoot />} />
              <Route path=":surveyId/builder" element={<FormBuilderPage />} />
              <Route path=":surveyId/logic" element={<LogicFlowPage />} />
              <Route path=":surveyId/preview" element={<PreviewPage />} />
              <Route path=":surveyId/analytics" element={<AnalyticsPage />} />
              <Route path=":surveyId/submissions" element={<SubmissionsPage />} />
              <Route path=":surveyId/theme" element={<ThemePage />} />
              <Route path=":surveyId/settings" element={<SettingsPage />} />
            </Route>

            {/* Default Redirects & 404 */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

