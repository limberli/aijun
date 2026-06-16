import { createContext, useContext, type ReactNode } from 'react'

/** All routable views. State-based routing lives in App; this context exposes navigation to
 * deep components (e.g. the rate-limit banner) without prop drilling. */
export type View = 'menu' | 'plan' | 'billing' | 'test-cases' | 'requirements-analysis'

const NavigationContext = createContext<(view: View) => void>(() => {})

export function NavigationProvider({
  navigate,
  children,
}: {
  navigate: (view: View) => void
  children: ReactNode
}) {
  return <NavigationContext.Provider value={navigate}>{children}</NavigationContext.Provider>
}

export function useNavigate(): (view: View) => void {
  return useContext(NavigationContext)
}
