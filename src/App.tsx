import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/portal" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="purchases" element={<Purchases />} />
          <Route path="register" element={<CashRegister />} />
          <Route path="reports" element={<Reports />} />
          <Route path="goals" element={<Goals />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

