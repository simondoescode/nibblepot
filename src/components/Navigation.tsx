import { BookOpen, CalendarDays, CookingPot, Heart, Settings2, ShoppingBasket } from 'lucide-react';
import type { Tab } from '../types';
import { PotIcon } from './PotArt';

const desktopLinks: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Recipes' },
  { id: 'favorites', label: 'Favourites' },
  { id: 'larder', label: 'Larder' },
  { id: 'planner', label: 'Planner' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'settings', label: 'Settings' },
];

const mobileLinks = [
  { id: 'home', label: 'Recipes', icon: BookOpen },
  { id: 'planner', label: 'Planner', icon: CalendarDays },
  { id: 'larder', label: 'Larder', icon: CookingPot },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBasket },
  { id: 'favorites', label: 'Favourites', icon: Heart },
] as const;

export function Header({ tab, shoppingCount, onNavigate, mobileVisible }: { tab: Tab; shoppingCount: number; onNavigate: (tab: Tab) => void; mobileVisible: boolean }) {
  return <div className="app-header-shell" data-mobile-visible={mobileVisible}><div className="wrap"><header className="header">
    <button className="brand" type="button" onClick={() => onNavigate('home')} aria-label="Simmer home">
      <span className="brand-pot"><PotIcon /></span><span>Simmer</span>
    </button>
    <nav className="topnav" aria-label="Main navigation">
      {desktopLinks.map(({ id, label }) => <button type="button" key={id}
        className={`navbtn ${tab === id ? 'active' : ''}`}
        aria-label={label} aria-description={id === 'shopping' && shoppingCount > 0 ? `${shoppingCount} to buy` : undefined} aria-current={tab === id ? 'page' : undefined}
        onClick={() => onNavigate(id)}>
        {label}
        {id === 'shopping' && shoppingCount > 0 && <span className="nav-count">{shoppingCount > 99 ? '99+' : shoppingCount}</span>}
      </button>)}
    </nav>
    <span className="small-print">DINNER, SORTED.</span>
    <div className="mobile-header-actions">
      <button type="button" aria-label="Open settings" onClick={() => onNavigate('settings')}><Settings2 size={21} aria-hidden="true"/></button>
    </div>
  </header></div></div>;
}

export function MobileNavigation({ tab, shoppingCount, onNavigate }: { tab: Tab; shoppingCount: number; onNavigate: (tab: Tab) => void }) {
  return <nav className="mobile-nav" aria-label="Mobile navigation">
    {mobileLinks.map(({ id, label, icon: Icon }) => <button type="button" key={id}
      className={`mobbtn ${tab === id ? 'active' : ''}`}
      aria-label={label} aria-description={id === 'shopping' && shoppingCount > 0 ? `${shoppingCount} to buy` : undefined}
      aria-current={tab === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
      <span className="mob-icon" aria-hidden="true"><Icon size={20} strokeWidth={2}/>
        {id === 'shopping' && shoppingCount > 0 && <span className="mob-count">{shoppingCount > 99 ? '99+' : shoppingCount}</span>}
      </span>
      <span className="mob-label">{label}</span>
    </button>)}
  </nav>;
}
