import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from "@/context/AppContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import LoginPage from "@/pages/LoginPage";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminGuestHouses from "@/pages/admin/AdminGuestHouses";
import AdminManagers from "@/pages/admin/AdminManagers";
import AdminRoomLayoutBuilder from "@/pages/admin/AdminRoomLayoutBuilder";
import AdminPendingApprovals from "@/pages/admin/AdminPendingApprovals";
import AdminReports from "@/pages/admin/AdminReports";
import AdminSettings from "@/pages/admin/AdminSettings";
import ManagerDashboard from "@/pages/manager/ManagerDashboard";
import ManagerRoomGrid from "@/pages/manager/ManagerRoomGrid";
import ManagerNewBooking from "@/pages/manager/ManagerNewBooking";
import ManagerBookings from "@/pages/manager/ManagerBookings";
import ManagerMaintenance from "@/pages/manager/ManagerMaintenance";
import ManagerReports from "@/pages/manager/ManagerReports";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute allowedRole="admin" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/guest-houses" element={<AdminGuestHouses />} />
                <Route path="/admin/managers" element={<AdminManagers />} />
                <Route path="/admin/room-layout-builder" element={<AdminRoomLayoutBuilder />} />
                <Route path="/admin/pending-approvals" element={<AdminPendingApprovals />} />
                <Route path="/admin/reports" element={<AdminReports />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute allowedRole="manager" />}>
              <Route element={<DashboardLayout />}>
                <Route path="/manager/dashboard" element={<ManagerDashboard />} />
                <Route path="/manager/room-grid" element={<ManagerRoomGrid />} />
                <Route path="/manager/new-booking" element={<ManagerNewBooking />} />
                <Route path="/manager/bookings" element={<ManagerBookings />} />
                <Route path="/manager/maintenance" element={<ManagerMaintenance />} />
                <Route path="/manager/reports" element={<ManagerReports />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
