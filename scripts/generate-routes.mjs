
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// GitHub Pages has no SPA history fallback. Materialise an HTML entrypoint for
// every recipe and tab so direct links, refresh, sharing and 404s all work.
const root = process.cwd();
const dist = path.join(root, 'dist');
const html = (await readFile(path.join(dist, 'index.html'), 'utf8')).replace(/<meta name="description"[^>]*>/g, '');
const recipes = JSON.parse(await readFile(path.join(root, 'src/data/recipes.json'), 'utf8'));
const ingredients = JSON.parse(await readFile(path.join(root, 'src/data/ingredients.json'), 'utf8'));
const origin = 'https://simondoescode.github.io';
const base = '/nibblepot/';
const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
function metaPage(title, description, urlPath, recipe, canonicalPath = urlPath, noindex = false) {
  const card = recipe || urlPath.includes('/recipes/') ? 'recipe'
    : urlPath.includes('/planner/') ? 'meal-plan'
    : urlPath.includes('/shopping/') ? 'shopping' : 'general';
  const image = origin + base + 'social/simmer-' + card + '-og.jpg';
  const imageAlt = {
    recipe: 'Simmer — You need to try this. A bowl of tomato pasta.',
    'meal-plan': 'Simmer — Your week, sorted. A weekly dinner planner.',
    shopping: 'Simmer — Shopping, sorted. A bag of groceries.',
    general: 'Simmer — Dinner, sorted. A family dinner casserole.',
  }[card];
  const meta = [
    '<meta name="description" content="' + escapeHTML(description) + '">',
    '<link rel="canonical" href="' + origin + canonicalPath + '">',
    ...(noindex ? ['<meta name="robots" content="noindex,follow">'] : []),
    '<meta property="og:site_name" content="Simmer">',
    '<meta property="og:locale" content="en_GB">',
    '<meta property="og:image" content="' + image + '">',
    '<meta property="og:image:secure_url" content="' + image + '">',
    '<meta property="og:image:alt" content="' + escapeHTML(imageAlt) + '">',
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + escapeHTML(title) + '">',
    '<meta name="twitter:description" content="' + escapeHTML(description) + '">',
    '<meta name="twitter:image" content="' + image + '">',
    '<meta name="twitter:image:alt" content="' + escapeHTML(imageAlt) + '">',
    '<meta property="og:type" content="' + (recipe ? 'article' : 'website') + '">',
    '<meta property="og:title" content="' + escapeHTML(title) + '">',
    '<meta property="og:description" content="' + escapeHTML(description) + '">',
    '<meta property="og:url" content="' + origin + urlPath + '">',
  ];
  if (recipe) {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Recipe', name: recipe.title, description: recipe.description,
      image: origin + base + (recipe.image ?? 'recipes/' + recipe.id + '.svg'), recipeYield: '4 servings', totalTime: 'PT' + recipe.mins + 'M',
      recipeIngredient: recipe.ing.map(item => item.qty + ' ' + (ingredients[item.id]?.[0] ?? item.id)),
      recipeInstructions: recipe.steps.map(step => ({ '@type': 'HowToStep', text: step })),
    };
    meta.push('<script type="application/ld+json">' + JSON.stringify(schema).replaceAll('<', '\\u003c') + '</script>');
  }
  const titleStart = html.indexOf('<title>');
  const titleEnd = html.indexOf('</title>', titleStart);
  if (titleStart === -1 || titleEnd === -1) throw new Error('Missing HTML title');
  const titled = html.slice(0, titleStart) +
    '<title>' + escapeHTML(title) + '</title>' +
    html.slice(titleEnd + '</title>'.length);
  return titled.replace('</head>', meta.join(String.fromCharCode(10)) + String.fromCharCode(10) + '</head>');
}
const pages = [
  { route: 'planner/shared', title: 'A shared week of dinners | Simmer', description: 'View a shared Simmer dinner plan for the week.', noindex: true },
  { route: 'shopping/shared', title: 'A shared shopping list | Simmer', description: 'Open a shared Simmer shopping list and tick off items as you shop.', noindex: true },
  ...recipes.map(recipe => ({
    route: 'recipes/' + recipe.id + '/cook',
    title: 'Cook ' + recipe.title + ' | Simmer',
    description: 'Step-by-step cooking mode for ' + recipe.title + '.',
    canonicalPath: base + 'recipes/' + recipe.id + '/',
    noindex: true,
  })),
  ...recipes.map(recipe => ({
    route: 'recipes/' + recipe.id, title: recipe.title + ' | Simmer',
    description: recipe.description + ' Ingredients and simple steps for four.',
    recipe,
  })),
  ...[
    ['favourites', 'Favourites'], ['larder', 'Larder'], ['planner', 'Meal planner'], ['shopping', 'Shopping list'], ['settings', 'Settings']
  ].map(([route,title]) => ({route,title: title + ' | Simmer', description: route === 'shopping' ? 'Keep the ingredients you need together with Simmer’s simple shopping list.' : route === 'planner' ? 'Plan a week of easy family dinners with Simmer.' : 'Simple family recipes, easier weeks and smarter shopping with Simmer.'})),
];
for (const page of pages) {
  const folder = path.join(dist, ...page.route.split('/'));
  await mkdir(folder, {recursive:true});
  await writeFile(path.join(folder,'index.html'),
    metaPage(page.title, page.description, base + page.route + '/', page.recipe, page.canonicalPath, page.noindex));
}
await writeFile(path.join(dist, 'index.html'), metaPage('Simmer — Dinner, sorted.', 'Simple family recipes, a weekly dinner planner and smarter shopping. Dinner, sorted with Simmer.', base));
console.log('Generated ' + pages.length + ' static GitHub Pages route entrypoints.');
