import { Route, Routes } from 'react-router-dom';
import { RequireAdmin } from './auth/RequireAdmin.tsx';
import { RequireAuth } from './auth/RequireAuth.tsx';
import { RootRoute } from './auth/RootRoute.tsx';
import { AdminLayout } from './components/AdminLayout.tsx';
import { AdminCatalogPage } from './pages/admin/AdminCatalogPage.tsx';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.tsx';
import { AdminFiscalDocumentDetailPage } from './pages/admin/AdminFiscalDocumentDetailPage.tsx';
import { AdminFiscalDocumentsPage } from './pages/admin/AdminFiscalDocumentsPage.tsx';
import { AdminFiscalItemsPage } from './pages/admin/AdminFiscalItemsPage.tsx';
import { AdminResolutionsPage } from './pages/admin/AdminResolutionsPage.tsx';
import { AdminStoreCodesPage } from './pages/admin/AdminStoreCodesPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { ImportReceiptPage } from './pages/ImportReceiptPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { PurchasesPage } from './pages/PurchasesPage.tsx';
import { ReceiptDetailPage } from './pages/ReceiptDetailPage.tsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />

      {/* Consumer area — anonymous trial or authenticated (M006.1). RootRoute
          renders the public landing page when there is neither. */}
      <Route path="/" element={<RootRoute />}>
        <Route index element={<DashboardPage />} />
        <Route path="importar" element={<ImportReceiptPage />} />
        <Route path="compras" element={<PurchasesPage />} />
        <Route path="compras/:id" element={<ReceiptDetailPage />} />
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
        <Route path="vocabulario" element={<AdminStoreCodesPage />} />
        <Route path="catalogo" element={<AdminCatalogPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
