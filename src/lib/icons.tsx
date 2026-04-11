import type { ReactNode } from 'react';

interface IconDef {
  label: string;
  category: string;
}

// Icon names map to SVG render functions
const ICON_RENDERERS: Record<string, () => ReactNode> = {
  // Fitness
  running: () => <><circle cx="12" cy="4" r="2" /><path d="M7 22l3-8 4 2 4-7" /><path d="M10 14l-1.5 8" /><path d="M17 7l-5 7" /></>,
  dumbbell: () => <><path d="M6.5 6.5h11M6.5 17.5h11" /><rect x="2" y="6.5" width="4.5" height="11" rx="1" /><rect x="17.5" y="6.5" width="4.5" height="11" rx="1" /></>,
  cycling: () => <><circle cx="7" cy="17" r="3" /><circle cx="17" cy="17" r="3" /><path d="M7 17l5-8 5 8" /><path d="M12 9l3-4" /></>,
  swimming: () => <><path d="M2 18c1.5-1.5 3.5-1.5 5 0s3.5 1.5 5 0 3.5-1.5 5 0 3.5 1.5 5 0" /><circle cx="12" cy="8" r="2" /><path d="M8 14l4-4 4 4" /></>,
  hiking: () => <><circle cx="13" cy="4" r="2" /><path d="M7 22l3-7 4 1" /><path d="M10 15l-3 7" /><path d="M14 8l-3 7" /><path d="M18 5l-4 9" /><line x1="18" y1="5" x2="19" y2="2" /></>,

  // Health
  heart: () => <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  apple: () => <><path d="M12 3c-1.5 0-3 .5-3 2 0 0-4 1-4 7 0 4 2 9 5 9 1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 5-5 5-9 0-6-4-7-4-7 0-1.5-1.5-2-3-2z" /><path d="M12 3c0-1 1-2 2-2" /></>,
  water: () => <path d="M12 2C12 2 5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13z" />,
  sleep: () => <><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></>,
  'weight-scale': () => <><rect x="4" y="14" width="16" height="6" rx="2" /><circle cx="12" cy="8" r="5" /><path d="M12 5v3l2 1" /></>,

  // Mind
  book: () => <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  write: () => <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></>,
  brain: () => <><path d="M9.5 2a3.5 3.5 0 0 0-3 5.1A3.5 3.5 0 0 0 5 10.5a3.5 3.5 0 0 0 1.8 3A3.5 3.5 0 0 0 9.5 17" /><path d="M14.5 2a3.5 3.5 0 0 1 3 5.1A3.5 3.5 0 0 1 19 10.5a3.5 3.5 0 0 1-1.8 3 3.5 3.5 0 0 1-2.7 3.5" /><path d="M12 2v15" /></>,
  journal: () => <><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8" /><path d="M8 10h8" /><path d="M8 14h4" /></>,
  headphones: () => <><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5z" /><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z" /></>,
  graduation: () => <><path d="M22 10l-10-5L2 10l10 5 10-5z" /><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5" /><line x1="22" y1="10" x2="22" y2="16" /></>,
  palette: () => <><circle cx="13.5" cy="6.5" r="1.5" /><circle cx="17.5" cy="10.5" r="1.5" /><circle cx="8.5" cy="7.5" r="1.5" /><circle cx="6.5" cy="12.5" r="1.5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.5-.75 1.5-1.5 0-.39-.15-.74-.39-1.04-.24-.3-.39-.65-.39-1.04 0-.93.75-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.17-4.5-9-10-9z" /></>,
  meditate: () => <><circle cx="12" cy="5" r="2" /><path d="M12 7v3" /><path d="M5 19c0-4 3-7 7-7s7 3 7 7" /><path d="M4 15l4 1" /><path d="M20 15l-4 1" /></>,

  // Productivity
  target: () => <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  code: () => <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
  lightbulb: () => <><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></>,
  clock: () => <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
  check: () => <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  calendar: () => <><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  focus: () => <><circle cx="12" cy="12" r="3" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="M2 12h4" /><path d="M18 12h4" /></>,
  briefcase: () => <><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></>,
  mail: () => <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></>,
  presentation: () => <><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
  wrench: () => <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />,

  // Lifestyle
  home: () => <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
  music: () => <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  plant: () => <><path d="M12 22V10" /><path d="M6 14c0-4 3-7.5 6-8" /><path d="M18 14c0-4-3-7.5-6-8" /><path d="M12 10c-3-4-6-4-9-2" /><path d="M12 10c3-4 6-4 9-2" /></>,
  coffee: () => <><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>,
  camera: () => <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
  car: () => <><path d="M5 17h14" /><path d="M5 11l1.5-4.5A2 2 0 0 1 8.4 5h7.2a2 2 0 0 1 1.9 1.5L19 11" /><rect x="3" y="11" width="18" height="6" rx="2" /><circle cx="7.5" cy="17" r="1.5" /><circle cx="16.5" cy="17" r="1.5" /></>,
  phone: () => <><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></>,

  // Social
  users: () => <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  handshake: () => <><path d="M11 17l-1.5 1.5a2.12 2.12 0 0 1-3-3L10 12" /><path d="M14 7l1.5-1.5a2.12 2.12 0 0 1 3 3L15 12" /><path d="M2 7l4 4" /><path d="M22 7l-4 4" /><path d="M10 12l4 0" /></>,
  chat: () => <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  gift: () => <><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></>,

  // Finance
  'piggy-bank': () => <><circle cx="12" cy="13" r="7" /><path d="M19 13h2v2h-2" /><path d="M12 6V4" /><path d="M7 20l-1 2" /><path d="M17 20l1 2" /><circle cx="10" cy="11" r="1" /></>,
  wallet: () => <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M16 12h2" /><path d="M2 10h20" /></>,
  'trending-up': () => <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,

  // Achievement
  star: () => <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  fire: () => <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z" />,
  trophy: () => <><path d="M6 9H4a2 2 0 0 1-2-2V5h4" /><path d="M18 9h2a2 2 0 0 0 2-2V5h-4" /><path d="M6 5a6 6 0 0 0 12 0v-1H6v1z" /><path d="M10 17h4" /><path d="M12 11v6" /><path d="M8 21h8" /></>,
  diamond: () => <><path d="M6 3h12l4 6-10 13L2 9l4-6z" /><path d="M2 9h20" /></>,
  flag: () => <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
  medal: () => <><circle cx="12" cy="15" r="6" /><path d="M8.21 3L12 8l3.79-5" /><path d="M12 8l-4-5h8l-4 5" /><path d="M12 15l1.5-3 1.5 3-3 .5 3-.5" /></>,

  // General
  bolt: () => <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  sun: () => <><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></>,
  moon: () => <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />,
  globe: () => <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z" /></>,
  rocket: () => <><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" /><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" /><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" /><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" /></>,
  mountain: () => <><path d="M8 3l-6 18h20L16 7l-4 6-4-10z" /></>,
  puzzle: () => <><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02z" /></>,
  smile: () => <><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></>,
  shield: () => <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  inbox: () => <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /></>,
  paw: () => <><ellipse cx="8" cy="6" rx="2" ry="2.5" /><ellipse cx="16" cy="6" rx="2" ry="2.5" /><ellipse cx="5" cy="11" rx="2" ry="2.5" /><ellipse cx="19" cy="11" rx="2" ry="2.5" /><path d="M12 22c-3 0-5-3-5-6 0-2 2-4 5-4s5 2 5 4c0 3-2 6-5 6z" /></>,
  'shopping-bag': () => <><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
};

export const ICON_LIST: { name: string; label: string; category: string }[] = [
  // Fitness
  { name: 'running', label: 'Running', category: 'Fitness' },
  { name: 'dumbbell', label: 'Gym', category: 'Fitness' },
  { name: 'cycling', label: 'Cycling', category: 'Fitness' },
  { name: 'swimming', label: 'Swimming', category: 'Fitness' },
  { name: 'hiking', label: 'Hiking', category: 'Fitness' },
  // Health
  { name: 'heart', label: 'Heart', category: 'Health' },
  { name: 'apple', label: 'Apple', category: 'Health' },
  { name: 'water', label: 'Water', category: 'Health' },
  { name: 'sleep', label: 'Sleep', category: 'Health' },
  { name: 'weight-scale', label: 'Weight', category: 'Health' },
  // Mind
  { name: 'book', label: 'Read', category: 'Mind' },
  { name: 'write', label: 'Write', category: 'Mind' },
  { name: 'brain', label: 'Brain', category: 'Mind' },
  { name: 'meditate', label: 'Meditate', category: 'Mind' },
  { name: 'journal', label: 'Journal', category: 'Mind' },
  { name: 'headphones', label: 'Listen', category: 'Mind' },
  { name: 'graduation', label: 'Study', category: 'Mind' },
  { name: 'palette', label: 'Art/Paint', category: 'Mind' },
  // Productivity
  { name: 'target', label: 'Target', category: 'Productivity' },
  { name: 'code', label: 'Code', category: 'Productivity' },
  { name: 'lightbulb', label: 'Ideas', category: 'Productivity' },
  { name: 'clock', label: 'Time', category: 'Productivity' },
  { name: 'check', label: 'Check', category: 'Productivity' },
  { name: 'calendar', label: 'Calendar', category: 'Productivity' },
  { name: 'focus', label: 'Focus', category: 'Productivity' },
  { name: 'briefcase', label: 'Work', category: 'Productivity' },
  { name: 'mail', label: 'Email', category: 'Productivity' },
  { name: 'presentation', label: 'Present', category: 'Productivity' },
  { name: 'wrench', label: 'Fix/Build', category: 'Productivity' },
  // Lifestyle
  { name: 'home', label: 'Home', category: 'Lifestyle' },
  { name: 'music', label: 'Music', category: 'Lifestyle' },
  { name: 'plant', label: 'Plant', category: 'Lifestyle' },
  { name: 'coffee', label: 'Coffee', category: 'Lifestyle' },
  { name: 'camera', label: 'Photo', category: 'Lifestyle' },
  { name: 'car', label: 'Drive', category: 'Lifestyle' },
  { name: 'phone', label: 'Phone', category: 'Lifestyle' },
  { name: 'paw', label: 'Pet', category: 'Lifestyle' },
  { name: 'shopping-bag', label: 'Shopping', category: 'Lifestyle' },
  // Social
  { name: 'users', label: 'People', category: 'Social' },
  { name: 'handshake', label: 'Handshake', category: 'Social' },
  { name: 'chat', label: 'Chat', category: 'Social' },
  { name: 'gift', label: 'Gift', category: 'Social' },
  // Finance
  { name: 'piggy-bank', label: 'Savings', category: 'Finance' },
  { name: 'wallet', label: 'Wallet', category: 'Finance' },
  { name: 'trending-up', label: 'Growth', category: 'Finance' },
  // Achievement
  { name: 'star', label: 'Star', category: 'Achievement' },
  { name: 'fire', label: 'Fire', category: 'Achievement' },
  { name: 'trophy', label: 'Trophy', category: 'Achievement' },
  { name: 'diamond', label: 'Diamond', category: 'Achievement' },
  { name: 'flag', label: 'Flag', category: 'Achievement' },
  { name: 'medal', label: 'Medal', category: 'Achievement' },
  // General
  { name: 'bolt', label: 'Energy', category: 'General' },
  { name: 'sun', label: 'Sun', category: 'General' },
  { name: 'moon', label: 'Moon', category: 'General' },
  { name: 'globe', label: 'Globe', category: 'General' },
  { name: 'rocket', label: 'Rocket', category: 'General' },
  { name: 'mountain', label: 'Mountain', category: 'General' },
  { name: 'smile', label: 'Smile', category: 'General' },
  { name: 'shield', label: 'Shield', category: 'General' },
  { name: 'puzzle', label: 'Puzzle', category: 'General' },
  { name: 'inbox', label: 'Inbox', category: 'General' },
];

export const DEFAULT_ICON = 'target';

export function GoalIcon({ name, size = 16 }: { name: string; size?: number }) {
  const renderer = ICON_RENDERERS[name];
  if (!renderer) {
    // Legacy emoji fallback
    return <span style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>{name}</span>;
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {renderer()}
    </svg>
  );
}

// Keep this for type-checking
export type { IconDef };
