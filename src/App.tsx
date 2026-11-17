import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar } from './components/Navbar';
import { SearchOverlay } from './components/SearchOverlay';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { WishlistPage } from './pages/WishlistPage';
import { AccountPage } from './pages/AccountPage';
import { ContactPage } from './pages/ContactPage';
import { AdminPage } from './pages/AdminPage';
import type { CategorySlug } from './types/store';

function AppRouter() {
  const { currentPath, toast } = useStore();
  const [pathname, queryStr = ''] = currentPath.split('?');
  const query = new URLSearchParams(queryStr);

  const renderPage = () => {
    if (pathname === '/' || pathname === '') {
      return <HomePage />;
    }
    if (pathname === '/shop') {
      return <CatalogPage initialCategory="all" />;
    }
    if (pathname.startsWith('/category/')) {
      const cat = pathname.replace('/category/', '').split('/')[0] as CategorySlug;
      if (['watches', 'dresses', 'sneakers', 'accessories'].includes(cat)) {
        return <CatalogPage initialCategory={cat} />;
      }
      return <CatalogPage initialCategory="all" />;
    }
    if (pathname.startsWith('/product/')) {
      const slug = pathname.replace('/product/', '').split('/')[0];
      return <ProductDetailPage slug={slug} />;
    }
    if (pathname === '/checkout') {
      return <CheckoutPage />;
    }
    if (pathname === '/checkout/verify') {
      return (
        <OrderConfirmationPage
          orderNumber={query.get('orderNumber') || undefined}
          verifyReference={query.get('reference')}
        />
      );
    }
    if (pathname.startsWith('/order/')) {
      const orderNumber = pathname.replace('/order/', '').split('/')[0];
      return <OrderConfirmationPage orderNumber={orderNumber} />;
    }
    if (pathname === '/wishlist') {
      return <WishlistPage />;
    }
    if (pathname === '/account') {
      return <AccountPage />;
    }
    if (pathname === '/contact') {
      return <ContactPage />;
    }
    if (pathname === '/admin') {
      return <AdminPage />;
    }
    return <HomePage />;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#0B0B0C]">
      <Navbar />
      <main className="flex-1">{renderPage()}</main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-[84px] right-4 sm:right-6 z-50 max-w-sm border px-5 py-3 text-xs font-medium shadow-lg ${
            toast.tone === 'error'
              ? 'border-red-300 bg-red-950 text-white'
              : 'border-[#C5A059]/40 bg-[#0B0B0C] text-white'
          }`}
        >
          {toast.text}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppRouter />
    </StoreProvider>
  );
}
