/**
 * The arcade roster — one list, read by `/games` and by `/pricing`.
 *
 * It lives here rather than inside `app/games/page.tsx` because the pricing
 * page sells the games by number and by name, and a hand-typed `GAME_COUNT`
 * there had already drifted (it said 7 while eight games shipped). Anything
 * that claims how many games exist must count this array.
 *
 * Card order is authored, not alphabetical — this is the order `/games`
 * shows.
 */

import type { ThumbnailParams } from '@/types/thumbnail';

export type GameCard = {
  /** the route, and the key the like/play counters are stored under */
  slug: string;
  /** game names stay English in every locale, like the games' own title screens */
  name: string;
  svgId: string;
  params: ThumbnailParams;
};

export const GAMES: GameCard[] = [
  {
    slug: 'typing-ninja',
    name: 'Ninja Run',
    svgId: 'NINJA_ARENA_COVER',
    params: { enemyCount: 14, accentColor: 'red' },
  },
  {
    slug: 'rhino-dash',
    name: 'Rhino Dash',
    svgId: 'RHINO_DASH_COVER',
    params: { keys: ['d', 'a', 's', 'h'], accentColor: 'amber' },
  },
  {
    slug: 'star-type',
    name: 'Star Type',
    svgId: 'STAR_TYPE_COVER',
    params: { keys: ['star', 'type', 'wave'], accentColor: 'blue' },
  },
  {
    slug: 'beam-break',
    name: 'Beam Break',
    svgId: 'BEAM_BREAK_COVER',
    params: { keys: ['b', 'e', 'a', 'm'], accentColor: 'emerald' },
  },
  {
    slug: 'alien-drop',
    name: 'Alien Drop',
    svgId: 'ALIEN_DROP_COVER',
    params: { keys: ['a', 'd', 'r'], accentColor: 'emerald' },
  },
  {
    slug: 'sky-hop',
    name: 'Sky Hop',
    svgId: 'SKY_HOP_COVER',
    params: { keys: ['f', 'j', 'd', 'k'], accentColor: 'blue' },
  },
  {
    slug: 'word-forge',
    name: 'Word Forge',
    svgId: 'WORD_FORGE_COVER',
    params: { keys: ['SHARP', 'BLAST', 'SNIPER', 'PISTOL'], accentColor: 'amber' },
  },
  {
    slug: 'tug-of-typing',
    name: 'Tug of Typing',
    svgId: 'TUG_OF_TYPING_COVER',
    params: { keys: ['p', 'u', 'l', 'l'], accentColor: 'emerald' },
  },
];

export const GAME_COUNT = GAMES.length;

/** Names for copy, split into two lines: `["a, b, c, d", "e, f, g, h"]`. */
export function gameNameLines(perLine = 4): string[] {
  const lines: string[] = [];
  for (let i = 0; i < GAMES.length; i += perLine) {
    lines.push(GAMES.slice(i, i + perLine).map((g) => g.name).join(', '));
  }
  return lines;
}
