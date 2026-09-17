import type { RefObject } from 'react'

type SidebarProps = {
  currentPath: string
  isDrawerOpen: boolean
  isVisible: boolean
  onClose: () => void
  sidebarRef: RefObject<HTMLElement | null>
}

type IconName =
  | 'overview'
  | 'orders'
  | 'products'
  | 'stock'
  | 'customers'
  | 'analytics'
  | 'settings'

type NavigationItem = {
  href: string
  icon: IconName
  label: string
}

const primaryNavigation: NavigationItem[] = [
  { href: '/', icon: 'overview', label: 'Genel Bakış' },
  { href: '/siparisler', icon: 'orders', label: 'Siparişler' },
  { href: '/urunler', icon: 'products', label: 'Ürünler' },
  { href: '/stok', icon: 'stock', label: 'Stok' },
  { href: '/musteriler', icon: 'customers', label: 'Müşteriler' },
  { href: '/analizler', icon: 'analytics', label: 'Analizler' },
]

const settingsNavigation: NavigationItem = {
  href: '/ayarlar',
  icon: 'settings',
  label: 'Ayarlar',
}

function NavigationIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    overview: (
      <>
        <rect height="7" rx="1" width="7" x="3" y="3" />
        <rect height="7" rx="1" width="7" x="14" y="3" />
        <rect height="7" rx="1" width="7" x="3" y="14" />
        <rect height="7" rx="1" width="7" x="14" y="14" />
      </>
    ),
    orders: (
      <>
        <rect height="18" rx="2" width="16" x="4" y="3" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </>
    ),
    products: (
      <>
        <path d="m4 7 8-4 8 4-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" />
      </>
    ),
    stock: (
      <>
        <rect height="5" rx="1" width="18" x="3" y="3" />
        <rect height="5" rx="1" width="18" x="3" y="10" />
        <rect height="5" rx="1" width="18" x="3" y="17" />
      </>
    ),
    customers: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20c0-4 2-6 6-6s6 2 6 6M16 4c3 0 5 2 5 5s-2 5-5 5M17 14c3 0 4 2 4 5" />
      </>
    ),
    analytics: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      className="app-shell__icon"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      className="app-shell__icon"
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function isActivePath(currentPath: string, href: string) {
  if (href === '/') {
    return currentPath === href
  }

  return currentPath === href || currentPath.startsWith(`${href}/`)
}

function NavigationLink({ currentPath, item }: { currentPath: string; item: NavigationItem }) {
  const isActive = isActivePath(currentPath, item.href)

  return (
    <a
      aria-current={isActive ? 'page' : undefined}
      className="app-sidebar__link"
      href={item.href}
    >
      <NavigationIcon name={item.icon} />
      <span>{item.label}</span>
    </a>
  )
}

function Sidebar({
  currentPath,
  isDrawerOpen,
  isVisible,
  onClose,
  sidebarRef,
}: SidebarProps) {
  return (
    <aside
      aria-hidden={!isVisible}
      aria-label={isDrawerOpen ? 'Ana navigasyon menüsü' : undefined}
      aria-modal={isDrawerOpen || undefined}
      className="app-sidebar"
      data-open={isVisible}
      id="app-sidebar"
      inert={!isVisible ? true : undefined}
      ref={sidebarRef}
      role={isDrawerOpen ? 'dialog' : undefined}
    >
      <div className="app-sidebar__brand-row">
        <a className="app-sidebar__brand" href="/">
          NOVA
        </a>

        <button
          aria-label="Ana navigasyon menüsünü kapat"
          className="app-sidebar__close-button"
          onClick={onClose}
          type="button"
        >
          <CloseIcon />
        </button>
      </div>

      <nav aria-label="Ana navigasyon" className="app-sidebar__navigation">
        {primaryNavigation.map((item) => (
          <NavigationLink currentPath={currentPath} item={item} key={item.href} />
        ))}
      </nav>

      <div className="app-sidebar__footer">
        <NavigationLink currentPath={currentPath} item={settingsNavigation} />
      </div>
    </aside>
  )
}

export default Sidebar
