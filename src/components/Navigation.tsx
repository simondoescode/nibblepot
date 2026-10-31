import type { Tab } from '../types';
import { PotIcon } from './PotArt';

const links: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🍽️', label: 'Recipes' },
  { id: 'favorites', icon: '❤️', label: 'Favourites' },
  { id: 'larder', icon: '🫙', label: 'Larder' },
  { id: 'planner', icon: '📅', label: 'Planner' },
  { id: 'shopping', icon: '🛒', label: 'Shopping' },
  { id: 'settings', icon: '⚙️', label: 'Settings' },
];

function Tabs({ tab, count, onNavigate, mobile }: { tab: Tab; count: number; onNavigate: (tab: Tab) => void; mobile: boolean }) {
  return <nav className={mobile ? 'mobile-nav' : 'topnav'} aria-label={mobile ? 'Mobile navigation' : 'Main navigation'}>
    {links.map(({ id, icon, label }) => <button type="button" key={id}
      className={`${mobile ? 'mobbtn' : 'navbtn'} ${tab === id ? 'active' : ''}`}
      aria-label={label} aria-current={tab === id ? 'page' : undefined} onClick={() => onNavigate(id)}>
      {mobile && <span aria-hidden="true">{icon}</span>}{label}
      {!mobile && id === 'shopping' && count > 0 && <span className="nav-count">{count}</span>}
    </button>)}
  </nav>;
}

export function Header({ tab, shoppingCount, onNavigate }: { tab: Tab; shoppingCount: number; onNavigate: (tab: Tab) => void }) {
  return <header className="header">
    <button className="brand" type="button" onClick={() => onNavigate('home')} aria-label="Nibblepot home">
      <span className="brand-pot"><PotIcon /></span><span>nibblepot<span className="brand-dot">.</span></span>
    </button>
    <Tabs tab={tab} count={shoppingCount} onNavigate={onNavigate} mobile={false} />
    <span className="small-print">GOOD GRUB. ZERO FAFF.</span>
  </header>;
}

export function MobileNavigation({ tab, shoppingCount, onNavigate }: { tab: Tab; shoppingCount: number; onNavigate: (tab: Tab) => void }) {
  return <Tabs tab={tab} count={shoppingCount} onNavigate={onNavigate} mobile />;
}
