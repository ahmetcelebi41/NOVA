import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import './AppShell.css'

const desktopMediaQuery = '(min-width: 1024px)'

type AppShellProps = {
  children: ReactNode
}

function getIsDesktop() {
  return typeof window !== 'undefined' && window.matchMedia(desktopMediaQuery).matches
}

function AppShell({ children }: AppShellProps) {
  const [isDesktop, setIsDesktop] = useState(getIsDesktop)
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)

  const isDrawerOpen = isNavigationOpen && !isDesktop
  const isSidebarVisible = isDesktop || isNavigationOpen

  const closeNavigation = useCallback(() => {
    setIsNavigationOpen(false)
    window.requestAnimationFrame(() => menuButtonRef.current?.focus())
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia(desktopMediaQuery)
    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches)

      if (event.matches) {
        setIsNavigationOpen(false)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isDrawerOpen) {
      return
    }

    const sidebar = sidebarRef.current
    const focusableElements = sidebar?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    const firstElement = focusableElements?.[0]
    const lastElement = focusableElements?.[focusableElements.length - 1]

    firstElement?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeNavigation()
        return
      }

      if (event.key !== 'Tab' || !firstElement || !lastElement) {
        return
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeNavigation, isDrawerOpen])

  return (
    <div className="app-shell">
      <Sidebar
        currentPath={window.location.pathname}
        isDrawerOpen={isDrawerOpen}
        isVisible={isSidebarVisible}
        onClose={closeNavigation}
        sidebarRef={sidebarRef}
      />

      {isDrawerOpen ? (
        <button
          aria-hidden="true"
          aria-label="Ana navigasyon menüsünü kapat"
          className="app-shell__backdrop"
          onClick={closeNavigation}
          tabIndex={-1}
          type="button"
        />
      ) : null}

      <div
        aria-hidden={isDrawerOpen || undefined}
        className="app-shell__body"
        inert={isDrawerOpen ? true : undefined}
      >
        <Header
          isNavigationOpen={isDrawerOpen}
          menuButtonRef={menuButtonRef}
          onOpenNavigation={() => setIsNavigationOpen(true)}
        />

        <main className="app-shell__main" id="main-content">
          <div className="app-shell__content">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default AppShell
