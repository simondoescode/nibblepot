
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

// GitHub Pages has no SPA history fallback. Materialise an HTML entrypoint for
// every recipe and tab so direct links, refresh, sharing and 404s all work.
const root = process.cwd();
const dist = path.join(root, 'dist');
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const recipes = JSON.parse(await readFile(path.join(root, 'src/data/recipes.json'), 'utf8'));
const ingredients = JSON.parse(await readFile(path.join(root, 'src/data/ingredients.json'), 'utf8'));
const origin = 'https://simondoescode.github.io';
const base = '/nibblepot/';
const escapeHTML = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
function metaPage(title, description, urlPath, recipe) {
  const meta = [
    '<meta name="description" content="' + escapeHTML(description) + '">',
    '<link rel="canonical" href="' + origin + urlPath + '">',
    '<meta property="og:type" content="' + (recipe ? 'article' : 'website') + '">',
    '<meta property="og:title" content="' + escapeHTML(title) + '">',
    '<meta property="og:description" content="' + escapeHTML(description) + '">',
    '<meta property="og:url" content="' + origin + urlPath + '">',
  ];
  if (recipe) {
    const image = origin + base + (recipe.image ?? 'recipes/' + recipe.id + '.svg');
    meta.push('<meta property="og:image" content="' + image + '">');
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Recipe', name: recipe.title, description: recipe.description,
      image: image, recipeYield: '4 servings', totalTime: 'PT' + recipe.mins + 'M',
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
  ...recipes.map(recipe => ({
    route: 'recipes/' + recipe.id, title: recipe.title + ' | Nibblepot',
    description: recipe.description + ' Ingredients and simple steps for four.',
    recipe,
  })),
  ...[
    ['favourites', 'Favourites'], ['larder', 'Larder'], ['planner', 'Meal planner'], ['shopping', 'Shopping list'], ['settings', 'Settings']
  ].map(([route,title]) => ({route,title: title + ' | Nibblepot', description: 'Nibblepot — Good grub. Zero faff.'})),
];
for (const page of pages) {
  const folder = path.join(dist, ...page.route.split('/'));
  await mkdir(folder, {recursive:true});
  await writeFile(path.join(folder,'index.html'),
    metaPage(page.title, page.description, base + page.route + '/', page.recipe));
}
console.log('Generated ' + pages.length + ' static GitHub Pages route entrypoints.');
