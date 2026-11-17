import { Mail, MapPin, Phone } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export function Footer() {
  const { navigate } = useStore();

  const linkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    navigate(path);
  };

  return (
    <footer className="bg-[#0B0B0C] text-[#FAF9F6] border-t border-white/10">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div>
            <p className="font-display text-2xl tracking-[0.2em] uppercase text-white">
              THE BLACK LABEL
            </p>
            <p className="mt-4 text-sm leading-relaxed text-neutral-400 max-w-xs">
              Contemporary horology, sculpted eveningwear, Italian leather footwear, and architectural accessories crafted for discerning wardrobes.
            </p>
            <div className="mt-6 space-y-2 text-xs text-neutral-400">
              <p className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[#C5A059] shrink-0" aria-hidden="true" />
                <span>18 Mount Street, Mayfair, London</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-[#C5A059] shrink-0" aria-hidden="true" />
                <span>+44 20 7946 0821</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-[#C5A059] shrink-0" aria-hidden="true" />
                <span>concierge@theblacklabel.com</span>
              </p>
            </div>
          </div>

          {/* Collections */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C5A059]">
              Collections
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-neutral-300">
              <li>
                <a href="/shop" onClick={(e) => linkClick(e, '/shop')} className="hover:text-white transition-colors">
                  Shop All Pieces
                </a>
              </li>
              <li>
                <a href="/category/watches" onClick={(e) => linkClick(e, '/category/watches')} className="hover:text-white transition-colors">
                  Watches
                </a>
              </li>
              <li>
                <a href="/category/dresses" onClick={(e) => linkClick(e, '/category/dresses')} className="hover:text-white transition-colors">
                  Dresses
                </a>
              </li>
              <li>
                <a href="/category/sneakers" onClick={(e) => linkClick(e, '/category/sneakers')} className="hover:text-white transition-colors">
                  Sneakers
                </a>
              </li>
              <li>
                <a href="/category/accessories" onClick={(e) => linkClick(e, '/category/accessories')} className="hover:text-white transition-colors">
                  Accessories
                </a>
              </li>
            </ul>
          </div>

          {/* Client Services */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C5A059]">
              Client Care
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-neutral-300">
              <li>
                <a href="/contact" onClick={(e) => linkClick(e, '/contact')} className="hover:text-white transition-colors">
                  Contact Concierge
                </a>
              </li>
              <li>
                <a href="/account" onClick={(e) => linkClick(e, '/account')} className="hover:text-white transition-colors">
                  Account &amp; Order Tracking
                </a>
              </li>
              <li>
                <a href="/wishlist" onClick={(e) => linkClick(e, '/wishlist')} className="hover:text-white transition-colors">
                  Saved Wishlist
                </a>
              </li>
              <li>
                <a href="/checkout" onClick={(e) => linkClick(e, '/checkout')} className="hover:text-white transition-colors">
                  Checkout
                </a>
              </li>
              <li>
                <a href="/admin" onClick={(e) => linkClick(e, '/admin')} className="hover:text-white transition-colors">
                  Store Administration
                </a>
              </li>
            </ul>
          </div>

          {/* Social & Atelier Hours */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#C5A059]">
              Maison &amp; Social
            </h3>
            <p className="mt-4 text-sm text-neutral-300 leading-relaxed">
              Private appointments available Monday to Saturday, 10:00 – 19:00 GMT.
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-xs uppercase tracking-[0.14em] text-neutral-400">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#C5A059] transition-colors"
              >
                Instagram
              </a>
              <a
                href="https://pinterest.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#C5A059] transition-colors"
              >
                Pinterest
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-[#C5A059] transition-colors"
              >
                X
              </a>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-neutral-500">
          <p>&copy; {new Date().getFullYear()} THE BLACK LABEL. All rights reserved.</p>
          <p>Insured global dispatch · Encrypted Paystack payment architecture</p>
        </div>
      </div>
    </footer>
  );
}
