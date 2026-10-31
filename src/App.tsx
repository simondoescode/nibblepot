
import { useCallback, useEffect, useRef, useState } from 'react';
import { recipes, ingredientName } from './data';
import { addMissingIngredients, chooseRandomRecipe } from './lib/recipes';
import { readSavedData, writeSavedData } from './lib/storage';
import { refreshPwa } from './lib/refresh';
import { basePath, parseRoute, recipePath, tabPath, type PageRoute } from './lib/routes';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import type { Filter, SavedData, Tab } from './types';
import { Header, MobileNavigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { FavouritesPage } from './components/FavouritesPage';
import { LarderPage } from './components/LarderPage';
import { ShoppingPage } from './components/ShoppingPage';
import { RecipePage } from './components/RecipePage';
import { RandomRecipeDialog } from './components/RandomRecipeDialog';
import { SettingsPage } from './components/SettingsPage';
import { PullIndicator } from './components/PullIndicator';

export default function App() {
  const [route, setRoute] = useState<PageRoute>(() => parseRoute(window.location.pathname));
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [randomId, setRandomId] = useState<string | null>(null);
  const [data, setData] = useState<SavedData>(readSavedData);
  const [notice, setNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialogReturnFocus = useRef<HTMLElement | null>(null);
  const lastTab = useRef<Tab>('home');

  useEffect(() => { writeSavedData(data); }, [data]);
  useEffect(() => {
    const sync = () => { setRoute(parseRoute(window.location.pathname)); setRandomId(null); };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    const recipe = route.kind === 'recipe' ? recipes.find(item => item.id === route.id) : undefined;
    document.title = recipe ? `${recipe.title} | Nibblepot` : 'Nibblepot — Good grub. Zero faff.';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = recipe
      ? `${recipe.description} Ingredients, instructions and a shopping list for this easy family meal.`
      : 'Easy, budget-friendly family dinners. Recipes, favourites, larder and shopping list.';
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.origin + window.location.pathname;
  }, [route]);

  const refresh = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    void refreshPwa();
  }, []);
  const pull = usePullToRefresh(refresh, !randomId && !refreshing);
  useEffect(() => () => { if (noticeTimeout.current) clearTimeout(noticeTimeout.current); }, []);
  const toast = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    noticeTimeout.current = setTimeout(() => setNotice(''), 2500);
  }, []);

  const changeRoute = useCallback((path: string, next: PageRoute) => {
    window.history.pushState({ nibblepot: true }, '', path);
    setRoute(next);
    setRandomId(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const navigate = useCallback((target: Tab) => {
    lastTab.current = target;
    changeRoute(tabPath(target), { kind: 'tab', tab: target });
  }, [changeRoute]);
  const openRecipe = useCallback((id: string) => {
    changeRoute(recipePath(id), { kind: 'recipe', id });
  }, [changeRoute]);
  const randomMeal = () => {
    if (!randomId && document.activeElement instanceof HTMLElement) dialogReturnFocus.current = document.activeElement;
    setRandomId(previous => chooseRandomRecipe(recipes, previous ?? undefined).id);
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
    setData(current => {
      const { shopping } = addMissingIngredients(recipe, current);
      return { ...current, shopping };
    });
    const added = addMissingIngredients(recipe, data).added;
    toast(added ? `Added ${added} missing ingredient${added === 1 ? '' : 's'} 🛒` : 'Nothing new to add — nice!');
  };
  const copyShopping = async () => {
    const list = data.shopping.map(item => `${item.done ? '✓' : '☐'} ${ingredientName(item.id)}`).join('\n');
    try { await navigator.clipboard.writeText(list); toast('Shopping list copied!'); }
    catch { toast('Copy not available here'); }
  };

  const tab: Tab = route.kind === 'tab' ? route.tab : lastTab.current;
  const activeRecipe = route.kind === 'recipe' ? recipes.find(recipe => recipe.id === route.id) : undefined;
  const randomRecipe = randomId ? recipes.find(recipe => recipe.id === randomId) : undefined;
  const backToRecipes = () => navigate(lastTab.current);
  return <>
    <PullIndicator distance={pull} refreshing={refreshing} />
    <div className="wrap">
      <Header tab={tab} shoppingCount={data.shopping.length} onNavigate={navigate} />
      <main className="main" id="main-content">
        {route.kind === 'recipe' && activeRecipe && <RecipePage key={activeRecipe.id} recipe={activeRecipe} larder={data.larder}
          saved={data.favorites.includes(activeRecipe.id)} onBack={backToRecipes}
          onAddMissing={() => addMissing(activeRecipe.id)} onFavorite={() => toggleFavorite(activeRecipe.id)} notify={toast} />}
        {(route.kind === 'not-found' || (route.kind === 'recipe' && !activeRecipe)) && <section className="recipe-page-not-found">
          <h1>That recipe's not in the pot 🍲</h1>
          <p>Try another recipe — there's plenty more for tea.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('home')}>Browse recipes</button>
        </section>}
        {route.kind === 'tab' && route.tab === 'home' && <HomePage filter={filter} setFilter={setFilter} search={search} setSearch={setSearch}
          favorites={data.favorites} larder={data.larder} onFavorite={toggleFavorite} onOpen={openRecipe}
          onRandom={randomMeal} onLarder={() => navigate('larder')} />}
        {route.kind === 'tab' && route.tab === 'favorites' && <FavouritesPage favorites={data.favorites} larder={data.larder}
          onFavorite={toggleFavorite} onOpen={openRecipe} onBrowse={() => navigate('home')} />}
        {route.kind === 'tab' && route.tab === 'larder' && <LarderPage larder={data.larder} onToggle={toggleLarder} onFindMeals={findMeals} />}
        {route.kind === 'tab' && route.tab === 'shopping' && <ShoppingPage shopping={data.shopping}
          onToggle={(id, done) => setData(current => ({ ...current, shopping: current.shopping.map(item => item.id === id ? { ...item, done } : item) }))}
          onRemove={id => setData(current => ({ ...current, shopping: current.shopping.filter(item => item.id !== id) }))}
          onClear={() => { setData(current => ({ ...current, shopping: current.shopping.filter(item => !item.done) })); toast('Ticked items cleared'); }}
          onCopy={copyShopping} onBrowse={() => navigate('home')} />}
        {route.kind === 'tab' && route.tab === 'settings' && <SettingsPage data={data} onRefresh={refresh} refreshing={refreshing}
          onRestore={setData} onReset={() => setData({ larder: [], favorites: [], shopping: [] })} notify={toast} />}
      </main>
      <footer className="footer">Made for real-life tea times ✳ Nibblepot demo</footer>
    </div>
    <MobileNavigation tab={tab} shoppingCount={data.shopping.length} onNavigate={navigate} />
    {randomRecipe && <RandomRecipeDialog recipe={randomRecipe} saved={data.favorites.includes(randomRecipe.id)}
      onClose={() => setRandomId(null)} onView={() => openRecipe(randomRecipe.id)} onReroll={randomMeal} returnFocusRef={dialogReturnFocus} />}
    {notice && <div className="toast" role="status" aria-live="polite">{notice}</div>}
  </>;
}
