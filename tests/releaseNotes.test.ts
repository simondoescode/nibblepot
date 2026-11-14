import { describe, expect, it } from 'vitest';
import { availableReleaseNotes, parseReleaseNotes } from '../src/lib/releaseNotes';

describe('user-facing release notes', () => {
  const changelog = `# Changelog

## [0.3.0](https://github.com/example/releases/tag/v0.3.0) (2026-11-20)

### Features

* add filters for meat-free meals (#80)
* make planning less fiddly (#81)

### Bug Fixes

* fix missing shopping items (#82)

## 0.2.0

### A first helping

- Recipes, favourites and a weekly plan for an easier dinner.
`;
  it('shows the newest release first with a short friendly title and highlights', () => {
    const releases = parseReleaseNotes(changelog);
    expect(releases.map(note => note.version)).toEqual(['0.3.0','0.2.0']);
    expect(releases[0].title).toBe('Fresh from the oven');
    expect(releases[0].date).toBe('2026-11-20');
    expect(releases[0].highlights).toEqual([
      'Add filters for meat-free meals.',
      'Make planning less fiddly.',
      'Fix missing shopping items.',
    ]);
    expect(releases[1].title).toBe('Our first helping');
  });
  it('does not reveal releases newer than the installed app', () => {
    const notes = parseReleaseNotes(changelog);
    expect(availableReleaseNotes(notes,'0.2.0').map(note => note.version)).toEqual(['0.2.0']);
    expect(availableReleaseNotes(notes,'0.3.0')).toHaveLength(2);
  });
  it('ignores headings and dependencies without showing empty versions', () => {
    const notes = parseReleaseNotes('## 0.4.0\n### Dependencies\n* update react\n## 0.3.1\n### Bug Fixes\n* fix the shopping list');
    expect(notes.map(note => note.version)).toEqual(['0.3.1']);
  });
});
