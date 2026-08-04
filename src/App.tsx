/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CustomerLayout from './components/layouts/CustomerLayout';
import AdminLayout from './components/layouts/AdminLayout';
import Home from './pages/customer/Home';
import ProductList from './pages/customer/ProductList';
import ProductDetail from './pages/customer/ProductDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProductsList from './pages/admin/ProductsList';
import AdminRepairsList from './pages/admin/RepairsList';
import RepairForm from './pages/admin/RepairForm';

import ProductForm from './pages/admin/ProductForm';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<CustomerLayout />}>
          <Route index element={<Home />} />
          <Route path="products" element={<ProductList />} />
          <Route path="products/:id" element={<ProductDetail />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProductsList />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="repairs" element={<AdminRepairsList />} />
          <Route path="repairs/new" element={<RepairForm />} />
          {/* Placeholders for others */}
          <Route path="inventory" element={<div className="p-8"><h1 className="text-2xl font-bold">Inventory Management</h1></div>} />
          <Route path="customers" element={<div className="p-8"><h1 className="text-2xl font-bold">Customer Management</h1></div>} />
          <Route path="settings" element={<div className="p-8"><h1 className="text-2xl font-bold">Settings</h1></div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
