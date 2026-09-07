import { Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './auth/RequireAdmin.tsx';
import { RequireAuth } from './auth/RequireAuth.tsx';
import { AdminLayout } from './components/AdminLayout.tsx';
import { AppLayout } from './components/AppLayout.tsx';
import { AdminCatalogPage } from './pages/admin/AdminCatalogPage.tsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx';
import { AdminFiscalDocumentDetailPage } from './pages/admin/AdminFiscalDocumentDetailPage.tsx';
import { AdminFiscalDocumentsPage } from './pages/admin/AdminFiscalDocumentsPage.tsx';
import { AdminFiscalItemsPage } from './pages/admin/AdminFiscalItemsPage.tsx';
import { AdminResolutionsPage } from './pages/admin/AdminResolutionsPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ImportReceiptPage } from './pages/ImportReceiptPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { PurchasesPage } from './pages/PurchasesPage.tsx';
import { ReceiptDetailPage } from './pages/ReceiptDetailPage.tsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/importar" element={<ImportReceiptPage />} />
        <Route path="/compras" element={<PurchasesPage />} />
        <Route path="/compras/:id" element={<ReceiptDetailPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="notas-fiscais" element={<AdminFiscalDocumentsPage />} />
        <Route path="notas-fiscais/:id" element={<AdminFiscalDocumentDetailPage />} />
        <Route path="itens" element={<AdminFiscalItemsPage />} />
        <Route path="resolucoes" element={<AdminResolutionsPage />} />
        <Route path="catalogo" element={<AdminCatalogPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
