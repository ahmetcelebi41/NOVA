import { Route, Routes } from 'react-router-dom'
import './App.css'
import AppShell from './components/layout/AppShell'
import AnalyticsPage from './pages/AnalyticsPage'
import CustomersPage from './pages/CustomersPage'
import NotFoundPage from './pages/NotFoundPage'
import OrderCreatePage from './pages/OrderCreatePage'
import OrderDetailPage from './pages/OrderDetailPage'
import OrdersPage from './pages/OrdersPage'
import OverviewPage from './pages/OverviewPage'
import ProductEditorPage from './pages/ProductEditorPage'
import ProductsPage from './pages/ProductsPage'
import SettingsPage from './pages/SettingsPage'
import StockPage from './pages/StockPage'

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="siparisler" element={<OrdersPage />} />
        <Route path="siparisler/yeni" element={<OrderCreatePage />} />
        <Route path="siparisler/:id" element={<OrderDetailPage />} />
        <Route path="urunler" element={<ProductsPage />} />
        <Route path="urunler/yeni" element={<ProductEditorPage mode="create" />} />
        <Route path="urunler/:id" element={<ProductEditorPage mode="edit" />} />
        <Route path="stok" element={<StockPage />} />
        <Route path="musteriler" element={<CustomersPage />} />
        <Route path="analizler" element={<AnalyticsPage />} />
        <Route path="ayarlar" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
