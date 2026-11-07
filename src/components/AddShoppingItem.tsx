import { useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { ingredients } from '../data';
import { customShoppingItem, MAX_SHOPPING_ITEM_LENGTH } from '../lib/shopping';
import type { ShoppingEntry } from '../types';
import { Button } from '../ui/controls';
import * as Dialog from '../ui/dialog';

const catalogue = Object.entries(ingredients).sort(([, [first]], [, [second]]) => first.localeCompare(second));

export function AddShoppingItem({ larder, onAdd }: {
  larder: string[];
  onAdd: (item: ShoppingEntry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [larderOnly, setLarderOnly] = useState(false);
  const custom = customShoppingItem(query);
  const search = custom?.customName?.toLowerCase() ?? '';
  const exact = catalogue.find(([id, [name]]) => search === name.toLowerCase() || search === id);
  const matches = catalogue.filter(([id, [name]]) =>
    (!larderOnly || larder.includes(id)) && (name.toLowerCase().includes(search) || id.includes(search)));

  const changeOpen = (next: boolean) => {
    if (next) {
      setQuery('');
      setLarderOnly(false);
    }
    setOpen(next);
  };
  const add = (item: ShoppingEntry) => {
    onAdd(item);
    changeOpen(false);
  };
  const addIngredient = (id: string) => add({ id, done: false, from: [] });

  return <Dialog.Root historyKey="add-shopping-item" open={open} onOpenChange={changeOpen}>
    <Dialog.Trigger asChild>
      <Button tone="primary" size="small" className="shopping-add-trigger" icon={<Plus size={18} />}>Add item</Button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="food-picker-overlay" />
      <Dialog.Content className="food-picker shopping-add-sheet">
        <div className="food-picker-heading">
          <Dialog.Title>Add a shopping item</Dialog.Title>
          <Dialog.Close className="food-picker-close" aria-label="Close add item"><X size={21} /></Dialog.Close>
        </div>
        <Dialog.Description>Search ingredients, pick from your larder or type anything you need.</Dialog.Description>
        <form onSubmit={event => {
          event.preventDefault();
          if (exact) addIngredient(exact[0]);
          else if (custom) add(custom);
        }}>
          <label className="shopping-add-search">
            <Search size={18} aria-hidden="true" />
            <input type="search" aria-label="Search ingredients or type an item" placeholder="Search or type an item"
              value={query} maxLength={MAX_SHOPPING_ITEM_LENGTH} onChange={event => setQuery(event.target.value)} />
          </label>
          {custom && !exact && <Button className="shopping-add-custom" type="submit" tone="primary"
            icon={<Plus size={17} />}>Add “{custom.customName}”</Button>}
        </form>
        <div className="shopping-filter shopping-add-filter" role="group" aria-label="Ingredient source">
          <button type="button" aria-pressed={!larderOnly} onClick={() => setLarderOnly(false)}>All ingredients</button>
          <button type="button" aria-pressed={larderOnly} onClick={() => setLarderOnly(true)}>My larder</button>
        </div>
        {matches.length ? <ul className="shopping-add-results" aria-label="Ingredient results">
          {matches.map(([id, [name, section]]) => <li key={id}>
            <button type="button" aria-label={`Add ${name}`} onClick={() => addIngredient(id)}>
              <span><strong>{name}</strong><small>{section}</small></span>
              <Plus size={17} aria-hidden="true" />
            </button>
          </li>)}
        </ul> : <p role="status">{larderOnly && !larder.length ? 'Your larder is empty.' : 'No matching ingredients.'}</p>}
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
