import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './layouts/AppShell'
import ChatPage from './pages/ChatPage'
import FeaturesPage from './pages/features/FeaturesPage'
import KnowledgeBasePage from './pages/knowledge-base/KnowledgeBasePage'
import LoginPage from './pages/LoginPage'
import PlaceholderPage from './pages/PlaceholderPage'
import PlatformSettingsPage from './pages/platform-settings/PlatformSettingsPage'
import RoleDetailPage from './pages/roles/RoleDetailPage'
import RolesPage from './pages/roles/RolesPage'
import ProtectedRoute from './routes/ProtectedRoute'
import RequirePermission from './routes/RequirePermission'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<ChatPage />} />
            <Route
              path="roles"
              element={
                <RequirePermission feature="roles">
                  <RolesPage />
                </RequirePermission>
              }
            />
            <Route
              path="roles/:roleId"
              element={
                <RequirePermission feature="roles">
                  <RoleDetailPage />
                </RequirePermission>
              }
            />
            <Route
              path="features"
              element={
                <RequirePermission feature="features">
                  <FeaturesPage />
                </RequirePermission>
              }
            />
            <Route
              path="users"
              element={
                <RequirePermission feature="users">
                  <PlaceholderPage />
                </RequirePermission>
              }
            />
            <Route
              path="sessions"
              element={
                <RequirePermission feature="sessions">
                  <PlaceholderPage />
                </RequirePermission>
              }
            />
            <Route
              path="notifications"
              element={
                <RequirePermission feature="notifications">
                  <PlaceholderPage />
                </RequirePermission>
              }
            />
            <Route
              path="knowledge-base"
              element={
                <RequirePermission feature="knowledge-base">
                  <KnowledgeBasePage />
                </RequirePermission>
              }
            />
            <Route
              path="platform-settings"
              element={
                <RequirePermission feature="platform-settings">
                  <PlatformSettingsPage />
                </RequirePermission>
              }
            />
            <Route
              path="admin-stats"
              element={
                <RequirePermission feature="admin-stats">
                  <PlaceholderPage />
                </RequirePermission>
              }
            />
            <Route
              path="profile"
              element={
                <RequirePermission feature="profile">
                  <PlaceholderPage />
                </RequirePermission>
              }
            />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
