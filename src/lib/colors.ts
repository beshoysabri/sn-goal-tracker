export const GOAL_COLORS = [
  // Yellows
  { name: 'Lemon', hex: '#FFF689' },
  { name: 'Mustard', hex: '#F4D35E' },
  // Oranges
  { name: 'Peach', hex: '#FFB88A' },
  { name: 'Tangerine', hex: '#FF9C5B' },
  { name: 'Flame', hex: '#F67B45' },
  // Pinks/Reds
  { name: 'Blush', hex: '#FBC2C2' },
  { name: 'Rose', hex: '#E39B99' },
  { name: 'Berry', hex: '#CB7876' },
  // Greens
  { name: 'Sage', hex: '#B4CFA4' },
  { name: 'Fern', hex: '#8BA47C' },
  { name: 'Forest', hex: '#62866C' },
  // Blues
  { name: 'Sky', hex: '#A0C5E3' },
  { name: 'Steel', hex: '#81B2D9' },
  { name: 'Ocean', hex: '#32769B' },
  // Purples
  { name: 'Lavender', hex: '#BBA6DD' },
  { name: 'Mauve', hex: '#8C7DA8' },
  { name: 'Plum', hex: '#64557B' },
  // Dark
  { name: 'Midnight', hex: '#1E2136' },
] as const;

export const DEFAULT_GOAL_COLOR = '#32769B';

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
