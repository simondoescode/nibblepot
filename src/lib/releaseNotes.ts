/** Convert the release changelog into concise, local, user-facing notes.
 * Release Please adds a new version section to CHANGELOG.md for each release.
 * Notes are compiled into the PWA: no GitHub API or connection required.
 */
export type ReleaseNote = { version: string; date?: string; title: string; highlights: string[] };

const heading = /^##\s+(?:\[)?v?(\d+\.\d+\.\d+)(?:\]\([^)]*\))?\s*(?:\((\d{4}-\d{2}-\d{2})\))?\s*$/;
const versionParts = (version: string) => version.split('.').map(Number);

function newerFirst(a: string, b: string): number {
  const left = versionParts(a);
  const right = versionParts(b);
  for (let i = 0; i < 3; i++) if (left[i] !== right[i]) return right[i] - left[i];
  return 0;
}

function readable(message: string): string {
  const cleaned = message
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s*\(#[0-9]+\)/g, '')
    .replace(/\s*\(https?:\/\/[^)]*\)/g, '')
    .replace(/\*\*/g, '')
    .replace(/^`|`$/g, '')
    .replace(/^(?:feat|fix|chore|docs|refactor)(?:\([^)]*\))?!?:\s*/i, '')
    .trim();
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1).replace(/[.!]$/, '') + '.' : '';
}

export function parseReleaseNotes(markdown: string): ReleaseNote[] {
  const releases: ReleaseNote[] = [];
  let active: ReleaseNote | undefined;
  let section = '';
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(heading);
    if (match) {
      active = { version: match[1], date: match[2], title: 'Fresh from the oven', highlights: [] };
      releases.push(active);
      section = '';
      continue;
    }
    if (!active) continue;
    if (/^##\s+/.test(line)) { active = undefined; continue; }
    const subheading = line.match(/^###\s+(.+)$/);
    if (subheading) {
      section = subheading[1].toLowerCase();
      if (section.includes('first helping')) active.title = 'Our first helping';
      continue;
    }
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    if (!bullet || active.highlights.length >= 3 || /breaking changes|dependencies/i.test(section)) continue;
    const message = readable(bullet[1]);
    if (message) active.highlights.push(message);
  }
  return releases.filter(release => release.highlights.length > 0)
    .sort((a,b) => newerFirst(a.version,b.version));
}

/** Do not display notes from a release newer than this installed app. */
export function availableReleaseNotes(notes: ReleaseNote[], installedVersion: string): ReleaseNote[] {
  return notes.filter(note => newerFirst(note.version, installedVersion) >= 0);
}
