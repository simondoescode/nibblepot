import { useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { BookOpen, CalendarDays, CookingPot, Ellipsis, Heart, Settings2, ShoppingBasket, X } from 'lucide-react';
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
] as const;

export function Header({ tab, shoppingCount, onNavigate }: { tab: Tab; shoppingCount: number; onNavigate: (tab: Tab) => void }) {
  return <header className="header">
    <button className="brand" type="button" onClick={() => onNavigate('home')} aria-label="Nibblepot home">
      <span className="brand-pot"><PotIcon /></span><span>nibblepot<span className="brand-dot">.</span></span>
    </button>
    <nav className="topnav" aria-label="Main navigation">
      {desktopLinks.map(({ id, label }) => <button type="button" key={id}
        className={`navbtn ${tab === id ? 'active' : ''}`}
        aria-label={label} aria-current={tab === id ? 'page' : undefined}
        onClick={() => onNavigate(id)}>
        {label}
        {id === 'shopping' && shoppingCount > 0 && <span className="nav-count">{shoppingCount}</span>}
      </button>)}
    </nav>
    <span className="small-print">GOOD GRUB. ZERO FAFF.</span>
  </header>;
}

export function MobileNavigation({ tab, shoppingCount, onNavigate }: { tab: Tab; shoppingCount: number; onNavigate: (tab: Tab) => void }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const choose = (destination: Tab) => { setMoreOpen(false); onNavigate(destination); };
  const moreActive = tab === 'favorites' || tab === 'settings';

  return <>
    <nav className="mobile-nav" aria-label="Mobile navigation">
      {mobileLinks.map(({ id, label, icon: Icon }) => <button type="button" key={id}
        className={`mobbtn ${tab === id ? 'active' : ''}`}
        aria-label={label} aria-current={tab === id ? 'page' : undefined}
        onClick={() => choose(id)}>
        <span className="mob-icon" aria-hidden="true"><Icon size={23} strokeWidth={tab === id ? 2.6 : 2} />
          {id === 'shopping' && shoppingCount > 0 && <span className="mob-count">{shoppingCount > 99 ? '99+' : shoppingCount}</span>}
        </span>
        <span className="mob-label">{label}</span>
      </button>)}
      <button ref={moreButton} type="button" className={`mobbtn ${moreActive ? 'active' : ''}`}
        aria-label="More" aria-haspopup="dialog" aria-expanded={moreOpen}
        onClick={() => setMoreOpen(true)}>
        <span className="mob-icon" aria-hidden="true"><Ellipsis size={24} strokeWidth={moreActive ? 2.6 : 2} /></span>
        <span className="mob-label">More</span>
      </button>
    </nav>
    <Dialog.Root open={moreOpen} onOpenChange={setMoreOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="mobile-more-overlay" />
        <Dialog.Content className="mobile-more-sheet" aria-describedby="mobile-more-description"
          onCloseAutoFocus={event => { event.preventDefault(); moreButton.current?.focus(); }}>
          <span className="mobile-more-handle" aria-hidden="true" />
          <div className="mobile-more-heading">
            <Dialog.Title>More Nibblepot</Dialog.Title>
            <Dialog.Close className="mobile-more-close" aria-label="Close More menu"><X size={21} aria-hidden="true" /></Dialog.Close>
          </div>
          <Dialog.Description id="mobile-more-description" className="sr-only">Choose another Nibblepot section.</Dialog.Description>
          <button type="button" className="mobile-more-option" aria-current={tab === 'favorites' ? 'page' : undefined}
            onClick={() => choose('favorites')}>
            <span className="mobile-more-option-icon"><Heart size={23} aria-hidden="true" /></span>
            <span><strong>Favourites</strong><small>Your saved go-to dinners</small></span>
          </button>
          <button type="button" className="mobile-more-option" aria-current={tab === 'settings' ? 'page' : undefined}
            onClick={() => choose('settings')}>
            <span className="mobile-more-option-icon"><Settings2 size={23} aria-hidden="true" /></span>
            <span><strong>Settings</strong><small>Refresh, backup and preferences</small></span>
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </>;
}
