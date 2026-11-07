import { Toast } from './components/Toast';
import { useAppNavigation } from './hooks/useAppNavigation';
import { useSessionState } from './hooks/useSessionState';
import { usePwa } from './hooks/usePwa';
import { InstallCard, PwaStatus } from './components/PwaExperience';

import { useCallback, useEffect, useRef, useState } from 'react';
import { recipes, ingredientName } from './data';
import type { FoodType } from './lib/foodTypes';
import { addMissingIngredients, chooseRandomRecipe } from './lib/recipes';
import { readSavedData, writeSavedData } from './lib/storage';
import { BASE_SERVINGS, clampServings, shoppingQuantity } from './lib/quantities';
import { applyWeekToShopping, defaultWeek, mondayFor, shuffleWeek } from './lib/weeklyPlan';
import { refreshPwa } from './lib/refresh';
import { cookingPath, recipePath, tabPath } from './lib/routes';
import { usePullToRefresh } from './hooks/usePullToRefresh';
import { pullOffset } from './lib/pullGesture';
import type { CSSProperties } from 'react';
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
  const pwa = usePwa();
  const { route, motion, lastTab, changeRoute, back } = useAppNavigation();
  const [filter, setFilter] = useSessionState<Filter>('recipe-filter', 'all');
  const [selectedFoodTypes, setSelectedFoodTypes] = useSessionState<FoodType[]>('food-types', []);
  const [search, setSearch] = useSessionState('recipe-search', '');
  const [focusSearch, setFocusSearch] = useState(false);
  const [randomId, setRandomId] = useState<string | null>(null);
  const [data, setData] = useState<SavedData>(readSavedData);
  const [selectedWeek, setSelectedWeek] = useState(() => mondayFor(new Date()));
  const [notice, setNotice] = useState('');
  const [noticeVersion,setNoticeVersion] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const noticeTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dialogReturnFocus = useRef<HTMLElement | null>(null);
  useEffect(() => { writeSavedData(data); }, [data]);
  useEffect(() => { setRandomId(null); }, [route]);
  useEffect(() => {
    const recipe = route.kind === 'recipe' || route.kind === 'cook'
      ? recipes.find(item => item.id === route.id) : undefined;
    document.title = recipe ? `${route.kind === 'cook' ? 'Cook ' : ''}${recipe.title} | Simmer` :
      'Simmer — Dinner, sorted.';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = recipe
      ? route.kind === 'cook' ? `Step-by-step cooking mode for ${recipe.title}.` :
        `${recipe.description} Ingredients, instructions and a shopping list for this easy family meal.`
      : 'Easy, budget-friendly family dinners. Recipes, favourites, larder and shopping list.';
    const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.origin + (route.kind === 'cook' && recipe
      ? recipePath(recipe.id) : window.location.pathname);
  }, [route]);

  const refresh = useCallback((beforeReload: Promise<void> = Promise.resolve()) => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    void refreshPwa(beforeReload).catch(() => {
      refreshingRef.current = false;
      setRefreshing(false);
      setNotice('Refresh failed. Please try again.');
    });
  }, []);
  const pull = usePullToRefresh(refresh, !randomId && route.kind !== 'cook', refreshing);
  useEffect(() => () => { if (noticeTimeout.current) clearTimeout(noticeTimeout.current); }, []);
  const toast = useCallback((message: string) => {
    setNotice(message);
    setNoticeVersion(value => value + 1);
    if (noticeTimeout.current) clearTimeout(noticeTimeout.current);
    noticeTimeout.current = setTimeout(() => setNotice(''), 2500);
  }, []);

  const navigate = useCallback((target: Tab) => {
    void changeRoute(tabPath(target), { kind: 'tab', tab: target });
  }, [changeRoute]);
  useEffect(() => {
    if (!focusSearch || route.kind !== 'tab' || route.tab !== 'home') return;
    const input = document.querySelector<HTMLInputElement>('#search');
    input?.focus({preventScroll:true});
    input?.scrollIntoView({block:'center',behavior:'auto'});
    setFocusSearch(false);
  }, [route, focusSearch]);
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
    larderQuantities: checked ? current.larderQuantities : Object.fromEntries(Object.entries(current.larderQuantities ?? {}).filter(([key])=>key!==id)),
    larderDates: checked ? current.larderDates : Object.fromEntries(Object.entries(current.larderDates ?? {}).filter(([key])=>key!==id)),
  }));
  const setLarderQuantity = (id: string, value: string) => setData(current => ({
    ...current, larderQuantities: {...current.larderQuantities, [id]:value.slice(0,40)},
  }));
  const setLarderDate = (id: string, value: string) => setData(current => ({
    ...current, larderDates: {...current.larderDates, [id]:value},
  }));
  const findMeals = () => { setSearch(''); setSelectedFoodTypes([]); setFilter('larder'); navigate('home'); };
  const addMissing = (id: string, optionalIds: string[] = []) => {
    const recipe = recipes.find(item => item.id === id);
    if (!recipe) return;
    const { added } = addMissingIngredients(recipe, data, optionalIds);
    setData(current => ({ ...current, shopping: addMissingIngredients(recipe, current, optionalIds).shopping }));
    toast(added ? `Added ${added} missing ingredient${added === 1 ? '' : 's'} 🛒` : 'Shopping list updated 🛒');
  };
  const copyShopping = async () => {
    const list = data.shopping.map(item =>
      `${item.done ? '✓' : '☐'} ${ingredientName(item.id)} — ${shoppingQuantity(item, data.servings, data.larderQuantities)}`
    ).join('\n');
    try { await navigator.clipboard.writeText(list); toast('Shopping list copied!'); }
    catch { toast('Copy not available here'); }
  };

  const tab: Tab = route.kind === 'tab' ? route.tab : lastTab.current;
  const activeRecipe = route.kind === 'recipe' ? recipes.find(recipe => recipe.id === route.id) : undefined;
  const randomRecipe = randomId ? recipes.find(recipe => recipe.id === randomId) : undefined;
  const lastRandom = useRef(randomRecipe);
  if (randomRecipe) lastRandom.current = randomRecipe;
  const activeCookRecipe = route.kind === 'cook' ? recipes.find(recipe => recipe.id === route.id) : undefined;
  const backToRecipes = () => back(tabPath(lastTab.current), {kind:'tab', tab:lastTab.current});
  const weekSlots = data.weekPlans?.[selectedWeek] ?? defaultWeek();
  const replaceSlots = (slots: typeof weekSlots) => setData(current => ({
    ...current, weekPlans: { ...current.weekPlans, [selectedWeek]: slots.map(slot => ({ ...slot })) },
  }));
  const planSpotlight = (id: string, day: number) => {
    if (!recipes.some(recipe => recipe.id === id) || !Number.isInteger(day) || day < 0 || day > 6) return;
    changeSlot(day, {kind:'recipe', id});
    toast(`Dinner added to ${['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'][day]}`);
  };
  const changeSlot = (index: number, slot: typeof weekSlots[number]) =>
    setData(current => {
      const slots = [...(current.weekPlans?.[selectedWeek] ?? defaultWeek())];
      slots[index] = slot;
      return {...current,weekPlans:{...current.weekPlans,[selectedWeek]:slots}};
    });
  const shuffleCurrentWeek = () => setData(current => ({
    ...current, weekPlans:{...current.weekPlans,
      [selectedWeek]:shuffleWeek(current.weekPlans?.[selectedWeek] ?? defaultWeek(),Math.random,current.larder)}
  }));
  const clearCurrentWeek = () => setData(current => ({
    ...current, weekPlans:{...current.weekPlans,
      [selectedWeek]:Array.from({length:7},()=>({kind:'empty' as const}))}
  }));
  const addWeek = () => {
    setData(current => applyWeekToShopping(current,current.weekPlans?.[selectedWeek] ?? defaultWeek(),selectedWeek));
    toast('Week added to shopping 🛒');
    navigate('shopping');
  };
  if (activeCookRecipe) return <><PwaStatus pwa={pwa} cooking /><CookingMode key={activeCookRecipe.id} recipe={activeCookRecipe}
    servings={data.servings?.[activeCookRecipe.id] ?? BASE_SERVINGS}
    onExit={() => back(recipePath(activeCookRecipe.id), {kind:'recipe',id:activeCookRecipe.id})} /></>;
  return <>
    <PwaStatus pwa={pwa} />
    <PullIndicator distance={pull.distance} refreshing={refreshing} />
    <Header tab={tab} shoppingCount={data.shopping.length} onNavigate={navigate}
      onSearch={()=>{navigate('home');setFocusSearch(true);}} />
    <div className={`wrap pull-body${pull.dragging ? ' is-pulling' : pull.settling ? ' is-settling' : ''}`}
      style={{ '--pull-shift': `${pullOffset(pull.distance)}px` } as CSSProperties}>
      <main key={route.kind === 'tab' ? route.tab : route.kind + ('id' in route ? route.id : '')} className="main route-content" data-motion={motion} id="main-content">
        {route.kind === 'tab' && route.tab === 'home' && <InstallCard pwa={pwa} />}
        {route.kind === 'recipe' && activeRecipe && <RecipePage key={activeRecipe.id} recipe={activeRecipe} larder={data.larder}
          saved={data.favorites.includes(activeRecipe.id)} servings={data.servings?.[activeRecipe.id] ?? BASE_SERVINGS}
          onServingsChange={value => setData(current => ({ ...current, servings: {
            ...current.servings, [activeRecipe.id]: clampServings(value),
          } }))} onBack={backToRecipes}
          onAddMissing={optionalIds => addMissing(activeRecipe.id, optionalIds)}
          onFavorite={() => toggleFavorite(activeRecipe.id)} onCook={() => startCooking(activeRecipe.id)}
          notify={toast} />}
        {(route.kind === 'not-found' || (route.kind === 'recipe' && !activeRecipe) || (route.kind === 'cook' && !activeCookRecipe)) && <section className="recipe-page-not-found">
          <h1>That recipe's not in the pot</h1>
          <p>Try another recipe — there's plenty more for tea.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('home')}>Browse recipes</button>
        </section>}
        {route.kind === 'tab' && route.tab === 'home' && <HomePage selectedFoodTypes={selectedFoodTypes} setSelectedFoodTypes={setSelectedFoodTypes} filter={filter} setFilter={setFilter} search={search} setSearch={setSearch}
          favorites={data.favorites} larder={data.larder} onFavorite={toggleFavorite} onOpen={openRecipe}
          weekSlots={weekSlots} onPlan={planSpotlight} onPlanner={() => navigate('planner')} onLarder={() => navigate('larder')} onShopping={() => navigate('shopping')} />}
        {route.kind === 'tab' && route.tab === 'favorites' && <FavouritesPage favorites={data.favorites} larder={data.larder}
          onFavorite={toggleFavorite} onOpen={openRecipe} onBrowse={() => navigate('home')} />}
        {route.kind === 'tab' && route.tab === 'larder' && <LarderPage larder={data.larder} quantities={data.larderQuantities} dates={data.larderDates} onDate={setLarderDate} onOpenRecipe={openRecipe} onQuantity={setLarderQuantity} onToggle={toggleLarder} onFindMeals={findMeals} />}
        {route.kind === 'tab' && route.tab === 'planner' && <WeekPlannerPage week={selectedWeek}
          slots={weekSlots} larder={data.larder} servings={data.servings ?? {}} shoppingPlan={data.shoppingPlan}
          hasGeneratedShopping={data.shopping.some(item => item.planGenerated || !!item.weekCounts)}
          onWeekChange={setSelectedWeek} onChange={changeSlot} onReplace={replaceSlots} onShuffle={shuffleCurrentWeek}
          onClear={clearCurrentWeek} onAdd={addWeek} onRecipe={openRecipe} />}
        {route.kind === 'tab' && route.tab === 'shopping' && <ShoppingPage shopping={data.shopping} servings={data.servings ?? {}} stock={data.larderQuantities}
          onToggle={(id, done) => setData(current => ({ ...current, shopping: current.shopping.map(item => item.id === id ? { ...item, done } : item) }))}
          onRemove={id => setData(current => ({ ...current, shopping: current.shopping.filter(item => item.id !== id) }))}
          onClear={() => { setData(current => ({ ...current, shopping: current.shopping.filter(item => !item.done) })); toast('Ticked items cleared'); }}
          onCopy={copyShopping} onBrowse={() => navigate('home')} />}
        {route.kind === 'tab' && route.tab === 'settings' && <SettingsPage pwa={pwa} data={data} onRefresh={() => refresh()} refreshing={refreshing}
          onRestore={setData} onReset={() => setData({ larder: [], favorites: [], shopping: [] })} notify={toast} />}
      </main>
      <footer className="footer">Made for real-life tea times ✳ Simmer demo</footer>
    </div>
    <MobileNavigation tab={tab} shoppingCount={data.shopping.length} onNavigate={navigate} />
    {lastRandom.current && <RandomRecipeDialog open={!!randomRecipe} recipe={lastRandom.current} saved={data.favorites.includes(lastRandom.current.id)}
      onReopen={() => setRandomId(lastRandom.current!.id)} onClose={() => setRandomId(null)} onView={() => { if (lastRandom.current) openRecipe(lastRandom.current.id); }} onReroll={randomMeal} returnFocusRef={dialogReturnFocus} />}
    {notice && <Toast key={noticeVersion} message={notice} />}
  </>;
}

