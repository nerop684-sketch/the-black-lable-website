import { useState } from 'react';
import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Shop', path: '/shop' },
  { label: 'Watches', path: '/category/watches' },
  { label: 'Dresses', path: '/category/dresses' },
  { label: 'Sneakers', path: '/category/sneakers' },
  { label: 'Accessories', path: '/category/accessories' },
  { label: 'Contact', path: '/contact' },
];

export function Navbar() {
  const {
    currentPath,
    navigate,
    cartTotals,
    setCartOpen,
    setSearchOpen,
    user,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const cleanPath = currentPath.split('?')[0];

  const handleNav = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-[#FAF9F6]/95 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between gap-2 sm:gap-6 px-3 sm:px-6 lg:px-8">
        {/* Mobile menu trigger + Brand */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 shrink-0">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            className="flex h-10 w-10 items-center justify-center text-[#0B0B0C] hover:text-[#9A7835] lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              handleNav('/');
            }}
            className="font-display text-[15px] sm:text-xl lg:text-2xl font-semibold tracking-[0.12em] sm:tracking-[0.18em] text-[#0B0B0C] whitespace-nowrap shrink-0 uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
          >
            THE BLACK LABEL
          </a>
        </div>

        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => {
            const isActive =
              link.path === '/'
                ? cleanPath === '/'
                : cleanPath === link.path || cleanPath.startsWith(`${link.path}/`);
            return (
              <a
                key={link.path}
                href={link.path}
                onClick={(e) => {
                  e.preventDefault();
                  handleNav(link.path);
                }}
                className={`relative py-1 text-[13px] font-medium tracking-[0.06em] uppercase whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] ${
                  isActive
                    ? 'text-[#0B0B0C] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#C5A059]'
                    : 'text-[#54534F] hover:text-[#0B0B0C]'
                }`}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search catalog"
            className="flex h-10 w-9 sm:w-10 items-center justify-center text-[#0B0B0C] transition-colors hover:text-[#9A7835] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
          >
            <Search className="h-[18px] w-[18px] sm:h-[19px] sm:w-[19px]" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => handleNav('/account')}
            aria-label={user ? `Account (${user.name})` : 'Account and order tracking'}
            className="flex h-10 w-9 sm:w-10 items-center justify-center text-[#0B0B0C] transition-colors hover:text-[#9A7835] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
          >
            <User className="h-[18px] w-[18px] sm:h-[19px] sm:w-[19px]" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label={`Open shopping bag (${cartTotals.itemCount} items)`}
            data-testid="cart-trigger"
            className="relative flex h-10 items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 text-[#0B0B0C] transition-colors hover:text-[#9A7835] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]"
          >
            <ShoppingBag className="h-[18px] w-[18px] sm:h-[19px] sm:w-[19px]" aria-hidden="true" />
            <span
              data-testid="cart-count"
              className="tabular-nums text-xs font-semibold tracking-wide"
            >
              {cartTotals.itemCount}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-black/[0.08] bg-[#FAF9F6] px-6 py-5 lg:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => {
              const isActive = cleanPath === link.path;
              return (
                <a
                  key={link.path}
                  href={link.path}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNav(link.path);
                  }}
                  className={`py-2 text-sm font-medium tracking-[0.08em] uppercase border-b border-black/[0.05] ${
                    isActive ? 'text-[#9A7835]' : 'text-[#0B0B0C]'
                  }`}
                >
                  {link.label}
                </a>
              );
            })}
            <div className="flex items-center gap-6 pt-2 text-xs font-medium uppercase tracking-wider text-[#54534F]">
              <a
                href="/wishlist"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/wishlist');
                }}
              >
                Wishlist
              </a>
              <a
                href="/account"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/account');
                }}
              >
                Account
              </a>
              <a
                href="/admin"
                onClick={(e) => {
                  e.preventDefault();
                  handleNav('/admin');
                }}
              >
                Admin
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
