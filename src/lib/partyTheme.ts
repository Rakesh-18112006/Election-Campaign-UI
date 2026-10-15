import type { PartyType, PartyTheme, UserTheme } from '@/types';

export const PARTY_OPTIONS: { value: PartyType; label: string }[] = [
  { value: 'TDP', label: 'TDP' },
  { value: 'YSRCP', label: 'YSRCP' },
  { value: 'JANASENA', label: 'JANASENA' },
  { value: 'BJP', label: 'BJP' },
  { value: 'CONGRESS', label: 'CONGRESS' },
  { value: 'OTHER', label: 'Other' },
];

// Mirrors backend/src/config/partyThemes.ts, used for the live preview in the create form.
export const PARTY_THEMES: Record<Exclude<PartyType, 'OTHER'>, PartyTheme> = {
  TDP: { primary: '#D9381E', dark: '#2F6B1F', tint: '#FFE600', accent: '#4C8C2B' },
  YSRCP: { primary: '#1F5FBF', dark: '#103A75', tint: '#8FB8F0', accent: '#1F9D4D' },
  JANASENA: { primary: '#C8202B', dark: '#6E0F17', tint: '#F4A3A8', accent: '#2B2B2B' },
  CONGRESS: { primary: '#138808', dark: '#0B5A22', tint: '#FFB35C', accent: '#FF9933' },
  BJP: { primary: '#F26B0C', dark: '#8F3A00', tint: '#FFC58A', accent: '#138808' },
};

export const DEFAULT_CUSTOM_COLOR = '#1D4ED8';

function parse(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function mix(a: string, b: string, weightOfB: number): string {
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const ch = (x: number, y: number) => Math.round(x + (y - x) * weightOfB).toString(16).padStart(2, '0');
  return `#${ch(ar, br)}${ch(ag, bg)}${ch(ab, bb)}`;
}

export function buildCustomTheme(primary: string): PartyTheme {
  return {
    primary,
    dark: mix(primary, '#000000', 0.55),
    tint: mix(primary, '#FFFFFF', 0.45),
    accent: mix(primary, '#000000', 0.25),
  };
}

function toHslTriplet(hex: string): string {
  const [r, g, b] = parse(hex).map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Replaces Tailwind's blue scale so every `bg-blue-*` / `text-blue-*` utility follows the party. */
export function buildBlueScale(t: PartyTheme): Record<string, string> {
  return {
    '50': mix(t.tint, '#FFFFFF', 0.9),
    '100': mix(t.tint, '#FFFFFF', 0.78),
    '200': mix(t.tint, '#FFFFFF', 0.55),
    '300': mix(t.tint, '#FFFFFF', 0.3),
    '400': mix(t.primary, '#FFFFFF', 0.35),
    '500': mix(t.primary, '#FFFFFF', 0.15),
    '600': mix(t.primary, '#FFFFFF', 0.08),
    '700': t.primary,
    '800': mix(t.primary, t.dark, 0.55),
    '900': t.dark,
  };
}

const SCALE_STEPS = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'];

export function applyTheme(theme: UserTheme | PartyTheme | null) {
  const root = document.documentElement;
  if (!theme) {
    SCALE_STEPS.forEach((s) => root.style.removeProperty(`--color-blue-${s}`));
    root.style.removeProperty('--primary');
    root.style.removeProperty('--ring');
    root.style.removeProperty('--accent-color');
    return;
  }
  const scale = buildBlueScale(theme);
  SCALE_STEPS.forEach((s) => root.style.setProperty(`--color-blue-${s}`, scale[s]));
  root.style.setProperty('--primary', toHslTriplet(theme.primary));
  root.style.setProperty('--ring', toHslTriplet(theme.primary));
  root.style.setProperty('--accent-color', theme.accent);
}

const CACHE_KEY = 'partyTheme';

export function readCachedTheme(): UserTheme | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as UserTheme) : null;
  } catch {
    return null;
  }
}

export function cacheTheme(theme: UserTheme | null) {
  try {
    if (theme) localStorage.setItem(CACHE_KEY, JSON.stringify(theme));
    else localStorage.removeItem(CACHE_KEY);
  } catch {
    // Storage unavailable (private mode); theming still works for this session.
  }
}
