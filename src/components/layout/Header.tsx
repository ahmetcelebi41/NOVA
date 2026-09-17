import type { RefObject } from 'react'

type HeaderProps = {
  isNavigationOpen: boolean
  menuButtonRef: RefObject<HTMLButtonElement | null>
  onOpenNavigation: () => void
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      className="app-shell__icon"
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function Header({ isNavigationOpen, menuButtonRef, onOpenNavigation }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <button
          aria-controls="app-sidebar"
          aria-expanded={isNavigationOpen}
          aria-label="Ana navigasyon menüsünü aç"
          className="app-header__menu-button"
          onClick={onOpenNavigation}
          ref={menuButtonRef}
          type="button"
        >
          <MenuIcon />
        </button>
      </div>
    </header>
  )
}

export default Header
