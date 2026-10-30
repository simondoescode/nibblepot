import { useCallback, useEffect, useRef, useState } from 'react';
import { recipes, ingredientName } from './data';
import { addMissingIngredients, chooseRandomRecipe } from './lib/recipes';
import { readSavedData, writeSavedData } from './lib/storage';
import { refreshPwa } from './lib/refresh';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import type { Filter, RecipeModal, SavedData, Tab } from './types';
import { Header, MobileNavigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { FavouritesPage } from './components/FavouritesPage';
import { LarderPage } from './components/LarderPage';
import { ShoppingPage } from './components/ShoppingPage';
import { RecipeDialog } from './components/RecipeDialog';
import { SettingsPage } from './components/SettingsPage';
import { PullIndicator } from './components/PullIndicator';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<RecipeModal | null>(null);
  const [data, setData] = useState<SavedData>(readSavedData);
  const [notice, setNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialogReturnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => { writeSavedData(data); }, [data]);
  const refresh = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    void refreshPwa();
  }, []);
  const pull = usePullToRefresh(refresh, !modal && !refreshing);
  useEffect(() => () => { if (noticeTimeout.current) clearTimeout(noticeTimeout.current); }, []);
  const toast = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    noticeTimeout.current = setTimeout(() => setNotice(''), 2500);
  }, []);

  const navigate = useCallback((target: Tab) => {
    setTab(target); setModal(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const randomMeal = () => {
    if (!modal && document.activeElement instanceof HTMLElement) dialogReturnFocus.current = document.activeElement;
    setModal(previous => ({ kind: 'random', id: chooseRandomRecipe(recipes, previous?.id).id }));
  };
  const openRecipe = (id: string) => {
    if (document.activeElement instanceof HTMLElement) dialogReturnFocus.current = document.activeElement;
    setModal({ kind: 'recipe', id });
  };
  const toggleFavorite = (id: string) => {
    const alreadySaved = data.favorites.includes(id);
    setData(current => ({ ...current, favorites: alreadySaved ? current.favorites.filter(favorite => favorite !== id) : [...current.favorites, id] }));
    toast(alreadySaved ? 'Removed from favourites' : 'Saved to favourites ❤️');
  };
  const toggleLarder = (id: string, checked: boolean) => setData(current => ({
    ...current, larder: checked ? [...new Set([...current.larder, id])] : current.larder.filter(ingredient => ingredient !== id),
  }));
  const findMeals = () => { setSearch(''); setFilter('larder'); navigate('home'); };
  const addMissing = (id: string) => {
    const recipe = recipes.find(item => item.id === id);
    if (!recipe) return;
    const { shopping, added } = addMissingIngredients(recipe, data);
    setData(current => ({ ...current, shopping }));
    setModal(null);
    toast(added ? `Added ${added} missing ingredient${added === 1 ? '' : 's'} 🛒` : 'Nothing new to add — nice!');
  };
  const copyShopping = async () => {
    const list = data.shopping.map(item => `${item.done ? '✓' : '☐'} ${ingredientName(item.id)}`).join('\n');
    try {
      await navigator.clipboard.writeText(list);
      toast('Shopping list copied!');
    } catch { toast('Copy not available here'); }
  };

  const activeRecipe = modal ? recipes.find(recipe => recipe.id === modal.id) : undefined;
  return <>
    <PullIndicator distance={pull} refreshing={refreshing} />
    <div className="wrap">
      <Header tab={tab} shoppingCount={data.shopping.length} onNavigate={navigate} />
      <main className="main">
        {tab === 'home' && <HomePage filter={filter} setFilter={setFilter} search={search} setSearch={setSearch}
          favorites={data.favorites} larder={data.larder} onFavorite={toggleFavorite} onOpen={openRecipe}
          onRandom={randomMeal} onLarder={() => navigate('larder')} />}
        {tab === 'favorites' && <FavouritesPage favorites={data.favorites} larder={data.larder}
          onFavorite={toggleFavorite} onOpen={openRecipe} onBrowse={() => navigate('home')} />}
        {tab === 'larder' && <LarderPage larder={data.larder} onToggle={toggleLarder} onFindMeals={findMeals} />}
        {tab === 'shopping' && <ShoppingPage shopping={data.shopping}
          onToggle={(id, done) => setData(current => ({ ...current, shopping: current.shopping.map(item => item.id === id ? { ...item, done } : item) }))}
          onRemove={id => setData(current => ({ ...current, shopping: current.shopping.filter(item => item.id !== id) }))}
          onClear={() => { setData(current => ({ ...current, shopping: current.shopping.filter(item => !item.done) })); toast('Ticked items cleared'); }}
          onCopy={copyShopping} onBrowse={() => navigate('home')} />}
        {tab === 'settings' && <SettingsPage data={data} onRefresh={refresh} refreshing={refreshing}
          onRestore={setData} onReset={() => setData({ larder: [], favorites: [], shopping: [] })} notify={toast} />}
      </main>
      <footer className="footer">Made for real-life tea times ✳ Nibblepot demo</footer>
    </div>
    <MobileNavigation tab={tab} shoppingCount={data.shopping.length} onNavigate={navigate} />
    {modal && activeRecipe && <RecipeDialog modal={modal} recipe={activeRecipe} larder={data.larder}
      saved={data.favorites.includes(activeRecipe.id)} onClose={() => setModal(null)}
      onView={() => setModal({ kind: 'recipe', id: activeRecipe.id })} onReroll={randomMeal}
      onAddMissing={() => addMissing(activeRecipe.id)} onFavorite={() => toggleFavorite(activeRecipe.id)} returnFocusRef={dialogReturnFocus} />}
    {notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}
  </>;
}
