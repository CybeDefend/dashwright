import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/auth.store";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SetupPage from "./pages/SetupPage";
import DashboardPage from "./pages/DashboardPage";
import TestRunDetailPage from "./pages/TestRunDetailPage";
import AdminPage from "./pages/AdminPage";
import ApiKeysPage from "./pages/ApiKeysPage";
import OrganizationPage from "./pages/OrganizationPage";
import AcceptInvitationPage from "./pages/AcceptInvitationPage";
import ManageUsersPage from "./pages/ManageUsersPage";
import ManageOrganizationsPage from "./pages/ManageOrganizationsPage";
import AppLayout from "./layouts/AppLayout";
import AuthProvider from "./components/AuthProvider";
import SetupProvider from "./components/SetupProvider";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <SetupProvider>
      <AuthProvider>
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/invite/accept/:token"
            element={<AcceptInvitationPage />}
          />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="runs/:id" element={<TestRunDetailPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/users" element={<ManageUsersPage />} />
            <Route
              path="admin/organizations"
              element={<ManageOrganizationsPage />}
            />
            <Route path="api-keys" element={<ApiKeysPage />} />
            <Route path="organization" element={<OrganizationPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </SetupProvider>
  );
}

export default App;
