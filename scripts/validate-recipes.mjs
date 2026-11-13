import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';

const recipes = JSON.parse(readFileSync('src/data/recipes.json', 'utf8'));
const ingredients = JSON.parse(readFileSync('src/data/ingredients.json', 'utf8'));
const units = new Set(['each','large','g','kg','ml','l','tsp','tbsp','tin','small tin','slice','clove','cube','sheet','leaf']);
const tags = new Set(['budget','batch-friendly','freezer-friendly','kid-friendly','minimal-prep']);
const ids = new Set(), slugs = new Set();
assert(Array.isArray(recipes) && recipes.length > 0, 'Catalogue must contain recipes');
for(const recipe of recipes) {
  const label = recipe.title || JSON.stringify(recipe);
  assert.match(recipe.id, /^[a-z0-9]{4}$/, label + ': ID must have four lowercase alphanumeric characters');
  assert(!ids.has(recipe.id), label + ': duplicate ID'); ids.add(recipe.id);
  assert.match(recipe.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, label + ': invalid slug');
  assert(!slugs.has(recipe.slug), label + ': duplicate slug'); slugs.add(recipe.slug);
  assert(typeof recipe.title === 'string' && recipe.title.length > 4 && typeof recipe.description === 'string' && recipe.description.length > 8, label + ': title/description required');
  assert(typeof recipe.emoji === 'string' && /^#[a-fA-F0-9]{6}$/.test(recipe.color), label + ': design metadata invalid');
  assert(Number.isInteger(recipe.mins) && recipe.mins >= 5 && recipe.mins <= 240, label + ': total time invalid');
  assert(Number.isInteger(recipe.prepMins) && recipe.prepMins > 0 && Number.isInteger(recipe.cookMins) && recipe.cookMins > 0 && recipe.prepMins + recipe.cookMins === recipe.mins, label + ': prep/cook times do not total');
  assert(typeof recipe.onePot === 'boolean' && Array.isArray(recipe.tags) && recipe.tags.every(t => tags.has(t)) && new Set(recipe.tags).size === recipe.tags.length, label + ': tags invalid');
  assert(Array.isArray(recipe.ing) && recipe.ing.length >= 3, label + ': ingredients missing');
  const known = new Set();
  for(const item of recipe.ing) {
    assert(Object.hasOwn(ingredients,item.id) && !known.has(item.id), label + ': unknown/duplicate ingredient '+item.id); known.add(item.id);
    assert(typeof item.amount === 'number' && Number.isFinite(item.amount) && item.amount > 0 && item.amount <= 100000, label + ': invalid amount '+item.id);
    assert(units.has(item.unit), label + ': invalid unit '+item.id);
    assert(item.note === undefined || item.note === 'dry', label + ': invalid note '+item.id);
    assert(item.optional === undefined || typeof item.optional === 'boolean', label + ': invalid optional flag '+item.id);
    assert(!Object.hasOwn(item,'qty'), label + ': obsolete free-text qty '+item.id);
  }
  assert(recipe.ing.some(i=>!i.optional), label + ': all ingredients optional');
  assert(Array.isArray(recipe.steps) && recipe.steps.length >= 2 && recipe.steps.every(s=>typeof s === 'string' && s.length >= 30), label + ': steps missing');
  assert(typeof recipe.safety === 'string' && recipe.safety.length > 30 && !/Cook raw chicken, sausages and mince|Cook poultry and sausages/i.test(recipe.safety),label + ': generic or missing safety guidance');
  assert(typeof recipe.storage === 'string' && recipe.storage.length > 55,label + ': storage guidance missing');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(recipe.reviewedOn) && !Number.isNaN(Date.parse(recipe.reviewedOn)),label + ': review date invalid');
  assert(typeof recipe.image === 'string' && /^recipes\/[a-z0-9-]+\.webp$/.test(recipe.image) && existsSync('public/'+recipe.image),label + ': image missing');
}
console.log('Validated '+recipes.length+' recipes, '+ids.size+' unique IDs and '+slugs.size+' unique slugs.');
