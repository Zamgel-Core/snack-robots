import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { POS } from './pages/POS';
import { Inventory } from './pages/Inventory';
import { Purchases } from './pages/Purchases';
import { CashRegister } from './pages/CashRegister';
import { Reports } from './pages/Reports';
import { Goals } from './pages/Goals';
import { Achievements } from './pages/Achievements';
import { Settings } from './pages/Settings';
import { Roles } from './pages/Roles';
import { AccessGuard } from './components/AccessGuard';
import { TabletPOS } from './pages/TabletPOS';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

export default function App() {
  return (
    <BrowserRouter>
      <PWAInstallPrompt />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/terminal"
          element={
            <ProtectedRoute>
              <AccessGuard permission="pos"><TabletPOS /></AccessGuard>
            </ProtectedRoute>
          }
        />

        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccessGuard permission="dashboard"><Dashboard /></AccessGuard>} />
          <Route path="pos" element={<AccessGuard permission="pos"><POS /></AccessGuard>} />
          <Route path="inventory" element={<AccessGuard permission="inventory"><Inventory /></AccessGuard>} />
          <Route path="purchases" element={<AccessGuard permission="purchases"><Purchases /></AccessGuard>} />
          <Route path="register" element={<AccessGuard permission="cash"><CashRegister /></AccessGuard>} />
          <Route path="reports" element={<AccessGuard permission="reports"><Reports /></AccessGuard>} />
          <Route path="goals" element={<AccessGuard permission="goals"><Goals /></AccessGuard>} />
          <Route path="achievements" element={<AccessGuard permission="achievements"><Achievements /></AccessGuard>} />
          <Route path="settings" element={<AccessGuard permission="settings"><Settings /></AccessGuard>} />
          <Route path="roles" element={<AccessGuard permission="roles"><Roles /></AccessGuard>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}