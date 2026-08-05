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
import Checkout from './pages/customer/Checkout';
import CheckoutSuccess from './pages/customer/CheckoutSuccess';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProductsList from './pages/admin/ProductsList';
import AdminRepairsList from './pages/admin/RepairsList';
import RepairForm from './pages/admin/RepairForm';
import RepairDetail from './pages/admin/RepairDetail';
import InventoryList from './pages/admin/InventoryList';
import InventoryForm from './pages/admin/InventoryForm';
import CustomerList from './pages/admin/CustomerList';
import CustomerDetail from './pages/admin/CustomerDetail';

import ProductForm from './pages/admin/ProductForm';
import OrderList from './pages/admin/OrderList';
import Settings from './pages/admin/Settings';
import OfflineSale from './pages/admin/OfflineSale';
import { SettingsProvider } from './contexts/SettingsContext';

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout/success" element={<CheckoutSuccess />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProductsList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/edit/:id" element={<ProductForm />} />
            <Route path="repairs" element={<AdminRepairsList />} />
            <Route path="repairs/new" element={<RepairForm />} />
            <Route path="repairs/:id" element={<RepairDetail />} />

            <Route path="inventory" element={<InventoryList />} />
            <Route path="inventory/new" element={<InventoryForm />} />
            <Route path="inventory/edit/:id" element={<InventoryForm />} />

            <Route path="customers" element={<CustomerList />} />
            <Route path="customers/:id" element={<CustomerDetail />} />

            <Route path="orders" element={<OrderList />} />

            <Route path="offline-sale" element={<OfflineSale />} />

            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SettingsProvider>
  );
}
