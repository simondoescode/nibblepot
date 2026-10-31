
import { useCallback, useEffect, useRef, useState } from 'react';
import { recipes, ingredientName } from './data';
import { addMissingIngredients, chooseRandomRecipe } from './lib/recipes';
import { readSavedData, writeSavedData } from './lib/storage';
import { BASE_SERVINGS, clampServings, shoppingQuantity } from './lib/quantities';
import { applyWeekToShopping, defaultWeek, mondayFor, shuffleWeek } from './lib/weeklyPlan';
import { refreshPwa } from './lib/refresh';
import { cookingPath, parseRoute, recipePath, tabPath, type PageRoute } from './lib/routes';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import type { Filter, SavedData, Tab } from './types';
import { Header, MobileNavigation } from './components/Navigation';
import { HomePage } from './components/HomePage';
import { FavouritesPage } from './components/FavouritesPage';
import { LarderPage } from './components/LarderPage';
import { WeekPlannerPage } from './components/WeekPlannerPage';
import { ShoppingPage } from './components/ShoppingPage';
import { RecipePage } from './components/RecipePage';
import { CookingMode } from './components/CookingMode';
import { RandomRecipeDialog } from './components/RandomRecipeDialog';
import { SettingsPage } from './components/SettingsPage';
import { PullIndicator } from './components/PullIndicator';

export default function App() {
  const [route, setRoute] = useState<PageRoute>(() => parseRoute(window.location.pathname));
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [randomId, setRandomId] = useState<string | null>(null);
  const [data, setData] = useState<SavedData>(readSavedData);
  const [selectedWeek, setSelectedWeek] = useState(() => mondayFor(new Date()));
  const [notice, setNotice] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialogReturnFocus = useRef<HTMLElement | null>(null);
  const lastTab = useRef<Tab>(route.kind === 'tab' ? route.tab : 'home');

  useEffect(() => { writeSavedData(data); }, [data]);
  useEffect(() => {
    const sync = () => {
      const next = parseRoute(window.location.pathname);
      if (next.kind === 'tab') lastTab.current = next.tab;
      setRoute(next);
      setRandomId(null);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  useEffect(() => {
    const recipe = route.kind === 'recipe' || route.kind === 'cook'
      ? recipes.find(item => item.id === route.id) : undefined;
    document.title = recipe ? `${route.kind === 'cook' ? 'Cook ' : ''}${recipe.title} | Nibblepot` :
      'Nibblepot — Good grub. Zero faff.';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = recipe
      ? route.kind === 'cook' ? `Step-by-step cooking mode for ${recipe.title}.` :
        `${recipe.description} Ingredients, instructions and a shopping list for this easy family meal.`
      : 'Easy, budget-friendly family dinners. Recipes, favourites, larder and shopping list.';
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.origin + (route.kind === 'cook' && recipe
      ? recipePath(recipe.id) : window.location.pathname);
  }, [route]);

  const refresh = useCallback(() => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    void refreshPwa();
  }, []);
  const pull = usePullToRefresh(refresh, !randomId && !refreshing && route.kind !== 'cook');
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
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  const navigate = useCallback((target: Tab) => {
    lastTab.current = target;
    changeRoute(tabPath(target), { kind: 'tab', tab: target });
  }, [changeRoute]);
  const openRecipe = useCallback((id: string) => {
    changeRoute(recipePath(id), { kind: 'recipe', id });
  }, [changeRoute]);
  const startCooking = useCallback((id: string) => {
    changeRoute(cookingPath(id), { kind: 'cook', id });
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
  const addMissing = (id: string, optionalIds: string[] = []) => {
    const recipe = recipes.find(item => item.id === id);
    if (!recipe) return;
    const { added } = addMissingIngredients(recipe, data, optionalIds);
    setData(current => ({ ...current, shopping: addMissingIngredients(recipe, current, optionalIds).shopping }));
    toast(added ? `Added ${added} missing ingredient${added === 1 ? '' : 's'} 🛒` : 'Shopping list updated 🛒');
  };
  const copyShopping = async () => {
    const list = data.shopping.map(item =>
      `${item.done ? '✓' : '☐'} ${ingredientName(item.id)} — ${shoppingQuantity(item, data.servings)}`
    ).join('\n');
    try { await navigator.clipboard.writeText(list); toast('Shopping list copied!'); }
    catch { toast('Copy not available here'); }
  };

  const tab: Tab = route.kind === 'tab' ? route.tab : lastTab.current;
  const activeRecipe = route.kind === 'recipe' ? recipes.find(recipe => recipe.id === route.id) : undefined;
  const randomRecipe = randomId ? recipes.find(recipe => recipe.id === randomId) : undefined;
  const activeCookRecipe = route.kind === 'cook' ? recipes.find(recipe => recipe.id === route.id) : undefined;
  const backToRecipes = () => navigate(lastTab.current);
  const weekSlots = data.weekPlans?.[selectedWeek] ?? defaultWeek();
  const changeSlot = (index: number, slot: typeof weekSlots[number]) =>
    setData(current => {
      const slots = [...(current.weekPlans?.[selectedWeek] ?? defaultWeek())];
      slots[index] = slot;
      return {...current,weekPlans:{...current.weekPlans,[selectedWeek]:slots}};
    });
  const shuffleCurrentWeek = () => setData(current => ({
    ...current, weekPlans:{...current.weekPlans,
      [selectedWeek]:shuffleWeek(current.weekPlans?.[selectedWeek] ?? defaultWeek())}
  }));
  const clearCurrentWeek = () => setData(current => ({
    ...current, weekPlans:{...current.weekPlans,
      [selectedWeek]:Array.from({length:7},()=>({kind:'empty' as const}))}
  }));
  const addWeek = () => {
    setData(current => applyWeekToShopping(current,current.weekPlans?.[selectedWeek] ?? defaultWeek()));
    toast('Week added to shopping 🛒');
    navigate('shopping');
  };
  if (activeCookRecipe) return <CookingMode key={activeCookRecipe.id} recipe={activeCookRecipe}
    servings={data.servings?.[activeCookRecipe.id] ?? BASE_SERVINGS}
    onExit={() => openRecipe(activeCookRecipe.id)} />;
  return <>
    <PullIndicator distance={pull} refreshing={refreshing} />
    <div className="wrap">
      <Header tab={tab} shoppingCount={data.shopping.length} onNavigate={navigate} />
      <main className="main" id="main-content">
        {route.kind === 'recipe' && activeRecipe && <RecipePage key={activeRecipe.id} recipe={activeRecipe} larder={data.larder}
          saved={data.favorites.includes(activeRecipe.id)} servings={data.servings?.[activeRecipe.id] ?? BASE_SERVINGS}
          onServingsChange={value => setData(current => ({ ...current, servings: {
            ...current.servings, [activeRecipe.id]: clampServings(value),
          } }))} onBack={backToRecipes}
          onAddMissing={optionalIds => addMissing(activeRecipe.id, optionalIds)}
          onFavorite={() => toggleFavorite(activeRecipe.id)} onCook={() => startCooking(activeRecipe.id)}
          notify={toast} />}
        {(route.kind === 'not-found' || (route.kind === 'recipe' && !activeRecipe) || (route.kind === 'cook' && !activeCookRecipe)) && <section className="recipe-page-not-found">
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
        {route.kind === 'tab' && route.tab === 'planner' && <WeekPlannerPage week={selectedWeek}
          slots={weekSlots} larder={data.larder} servings={data.servings ?? {}}
          onWeekChange={setSelectedWeek} onChange={changeSlot} onShuffle={shuffleCurrentWeek}
          onClear={clearCurrentWeek} onAdd={addWeek} onRecipe={openRecipe} />}
        {route.kind === 'tab' && route.tab === 'shopping' && <ShoppingPage shopping={data.shopping} servings={data.servings ?? {}}
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
