/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import CustomerLayout from './components/layouts/CustomerLayout';
import AdminLayout from './components/layouts/AdminLayout';
import Home from './pages/customer/Home';
import ProductList from './pages/customer/ProductList';
import ProductDetail from './pages/customer/ProductDetail';
import Checkout from './pages/customer/Checkout';
import CheckoutSuccess from './pages/customer/CheckoutSuccess';
import Services from './pages/customer/Services';
import CustomPC from './pages/customer/CustomPC';
import CustomPCBuilder from './pages/customer/CustomPCBuilder';
import PrebuiltPCs from './pages/customer/PrebuiltPCs';
import PrebuiltPCDetail from './pages/customer/PrebuiltPCDetail';
import LegalPage from './pages/customer/LegalPage';
import SitemapPage from './pages/customer/SitemapPage';
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
import CustomPCRequests from './pages/admin/CustomPCRequests';
import OrderList from './pages/admin/OrderList';
import OrderDetail from './pages/admin/OrderDetail';
import PrebuiltsList from './pages/admin/PrebuiltsList';
import PrebuiltForm from './pages/admin/PrebuiltForm';
import Settings from './pages/admin/Settings';
import OfflineSale from './pages/admin/OfflineSale';
import { SettingsProvider } from './contexts/SettingsContext';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/admin/Login';

import QuotationView from './pages/customer/QuotationView';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Customer Routes */}
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Home />} />
            <Route path="services" element={<Services />} />
            <Route path="custom-pc" element={<CustomPC />} />
            <Route path="custom-pc/builder" element={<CustomPCBuilder />} />
            <Route path="quote/:id" element={<QuotationView />} />
            <Route path="custom-pc/quote/:id" element={<QuotationView />} />
            <Route path="prebuilt-pc" element={<PrebuiltPCs />} />
            <Route path="prebuilt-pc/:id" element={<PrebuiltPCDetail />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/:id" element={<ProductDetail />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="checkout/success" element={<CheckoutSuccess />} />
            <Route path="legal/:policyId" element={<LegalPage />} />
            <Route path="sitemap" element={<SitemapPage />} />
          </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProductsList />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/edit/:id" element={<ProductForm />} />
              <Route path="prebuilt-pcs" element={<PrebuiltsList />} />
              <Route path="prebuilt-pcs/new" element={<PrebuiltForm />} />
              <Route path="prebuilt-pcs/edit/:id" element={<PrebuiltForm />} />
              <Route path="custom-pc-requests" element={<CustomPCRequests />} />
              <Route path="repairs" element={<AdminRepairsList />} />
              <Route path="repairs/new" element={<RepairForm />} />
              <Route path="repairs/:id" element={<RepairDetail />} />

              <Route path="inventory" element={<InventoryList />} />
              <Route path="inventory/new" element={<InventoryForm />} />
              <Route path="inventory/edit/:id" element={<InventoryForm />} />

              <Route path="customers" element={<CustomerList />} />
              <Route path="customers/:id" element={<CustomerDetail />} />

              <Route path="orders" element={<OrderList />} />
              <Route path="orders/:id" element={<OrderDetail />} />

              <Route path="offline-sale" element={<OfflineSale />} />
              <Route path="offline-sale/edit/:id" element={<OfflineSale />} />

              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}
