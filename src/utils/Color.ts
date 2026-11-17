export interface RGBA { r: number; g: number; b: number; a: number } // r,g,b 0-255, a 0-1
interface HSL { h: number; s: number; l: number } // h 0-360, s/l 0-1

/** Colori del tema disponibili nei componenti. */
export const ThemeColor = {
    PRIMARY: 'primary',
    SECONDARY: 'secondary',
    SUCCESS: 'success',
    DANGER: 'danger',
    WARNING: 'warning',
    INFO: 'info',
    PRIMARY_CONTRAST: 'primary-contrast',
    RED: 'red',
    GREEN: 'green',
    BLUE: 'blue',
    LIGHT_BLUE: 'light-blue',
    ORANGE: 'orange',
    YELLOW: 'yellow',
    GRAY: 'gray',
    LIGHT_GRAY: 'light-gray',
    BLACK: 'black',
    WHITE: 'white',
    TRANSPARENT: 'transparent',
} as const;

export type ThemeColorName = (typeof ThemeColor)[keyof typeof ThemeColor];

/**
 * Un colore del tema oppure un qualsiasi colore CSS (`#hex`, `rgb()`, `var(--x)`…).
 * `string & {}` mantiene l'autocompletamento dei nomi del tema.
 */
export type ThemeColor = ThemeColorName | (string & {});

const THEME_COLORS = new Set<string>(Object.values(ThemeColor));

export const ThemeVariant = {
    FILLED: 'filled',
    OUTLINED: 'outlined'
}

export type ThemeVariantName = (typeof ThemeVariant)[keyof typeof ThemeVariant];

/**
 * Variante di visualizzazione del componente
 * filled - colore pieno
 * outlined - colore di contorno
 */
export type ThemeVariant = ThemeVariantName;

/**
 * Converte un colore in un'espressione CSS.
 *
 * @remarks
 * I colori del tema diventano `var(--vfo-color-<nome>)`, così seguono il tema del progetto.
 * Gli altri valori vengono restituiti invariati.
 *
 * @param color - Colore del tema o colore CSS. Se assente si usa `primary`.
 * @returns L'espressione CSS da usare in `style` o in una variabile CSS.
 *
 * @example
 * ```ts
 * toCssColor('danger');  // → 'var(--vfo-color-danger)'
 * toCssColor('#E63946'); // → '#E63946'
 * ```
 */
export function toCssColor(color?: ThemeColor): string {
    if (!color) return 'var(--vfo-color-primary)';
    return THEME_COLORS.has(color) ? `var(--vfo-color-${color})` : color;
}

/**
 * Restituisce un colore con trasparenza, calcolata dal browser con `color-mix`.
 *
 * @param color - Colore del tema o colore CSS.
 * @param alpha - Opacità da 0 a 1.
 * @returns L'espressione CSS `color-mix(...)`.
 *
 * @example
 * ```ts
 * withAlpha('primary', 0.15);
 * // → 'color-mix(in srgb, var(--vfo-color-primary) 15%, transparent)'
 * ```
 */
export function withAlpha(color: ThemeColor, alpha = 1): string {
    const pct = Math.round(Math.min(Math.max(alpha, 0), 1) * 100);
    return `color-mix(in srgb, ${toCssColor(color)} ${pct}%, transparent)`;
}



/**
 * Ricava un colore di contrasto a partire da un colore CSS.
 * - Colore chiaro  -> stessa tinta, ma scura (es. verde chiaro -> verde scuro)
 * - Colore scuro   -> stessa tinta, ma chiara
 * Il risultato rispetta un rapporto di contrasto WCAG minimo (default 4.5 = AA testo normale).
 * Se non è raggiungibile mantenendo la tinta, ripiega su nero/bianco.
 */

export type ContrastOptions = {
    /** Rapporto di contrasto WCAG minimo. Default 4.5 (AA). Usa 7 per AAA. */
    minContrast?: number;
    /** 'tinted' mantiene la tinta, 'blackWhite' restituisce solo #000/#fff. Default 'tinted'. */
    mode?: 'tinted' | 'blackWhite';
    /** Formato di output. Default 'hex'. */
    output?: 'hex' | 'rgb' | 'hsl';
}

// ---------- Parsing ----------

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

function parseChannel(v: string, max: number): number {
    return v.endsWith('%') ? (parseFloat(v) / 100) * max : parseFloat(v);
}

function parseAlpha(v?: string): number {
    if (v === undefined) return 1;
    return clamp(v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v));
}

function parseHue(v: string): number {
    const n = parseFloat(v);
    if (v.endsWith('rad')) return (n * 180) / Math.PI;
    if (v.endsWith('grad')) return n * 0.9;
    if (v.endsWith('turn')) return n * 360;
    return n; // deg o numero puro
}

export function parseCssColor(input: string): RGBA | null {
    const str = input.trim().toLowerCase();
    // console.log(input);

    // #rgb, #rgba, #rrggbb, #rrggbbaa
    const hex = str.match(/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/);
    if (hex) {
        let h = hex[1];
        if (h.length <= 4) h = [...h].map(c => c + c).join('');
        return {
            r: parseInt(h.slice(0, 2), 16),
            g: parseInt(h.slice(2, 4), 16),
            b: parseInt(h.slice(4, 6), 16),
            a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
        };
    }

    // rgb()/rgba() — sintassi con virgole o con spazi e "/"
    const rgb = str.match(/^rgba?\(([^)]+)\)$/);
    if (rgb) {
        const p = rgb[1].split(/[\s,\/]+/).filter(Boolean);
        if (p.length < 3) return null;
        return {
            r: clamp(parseChannel(p[0], 255), 0, 255),
            g: clamp(parseChannel(p[1], 255), 0, 255),
            b: clamp(parseChannel(p[2], 255), 0, 255),
            a: parseAlpha(p[3]),
        };
    }

    // hsl()/hsla()
    const hsl = str.match(/^hsla?\(([^)]+)\)$/);
    if (hsl) {
        const p = hsl[1].split(/[\s,\/]+/).filter(Boolean);
        if (p.length < 3) return null;
        const { r, g, b } = hslToRgb({
            h: parseHue(p[0]),
            s: clamp(parseFloat(p[1]) / 100),
            l: clamp(parseFloat(p[2]) / 100),
        });
        return { r, g, b, a: parseAlpha(p[3]) };
    }

    const custom = str.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/);
    if (custom) {
        const p = resolveCssColor(str);
        console.log(p);
        return p;
    }

    // Colori nominali (es. "lightgreen") e altri formati: delega al browser se disponibile
    if (typeof document !== 'undefined') {
        const ctx = document.createElement('canvas').getContext('2d');
        if (ctx) {
            // doppio sentinella per capire se il valore è stato accettato
            ctx.fillStyle = '#000';
            ctx.fillStyle = str;
            const a = ctx.fillStyle;
            ctx.fillStyle = '#fff';
            ctx.fillStyle = str;
            const b = ctx.fillStyle;
            if (a === b) return a.startsWith('#') || a.startsWith('rgb') ? parseCssColor(a) : null;
        }
    }

    return null;
}

/** Risolve "var(--x)" (anche annidate o con fallback) e restituisce sempre un hex */
export function resolveCssColor(
    value: string | undefined,
    el: Element = document.documentElement
): RGBA | null {
    if (!value || typeof window === 'undefined') return null;

    let _color = value.trim();
    const m = _color.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*(.+))?\)$/);
    if (m) {
        const resolved = getComputedStyle(el).getPropertyValue(m[1]).trim();
        const color = toRgba(resolved) || resolveCssColor(m[2], el) || '';
        if (!color) return null;
        return color;
    }

    return null;
}

// ---------- Conversioni ----------

export function rgbToHsl({ r, g, b }: RGBA): HSL {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return { h: 0, s: 0, l };
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h: number;
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: h * 60, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGBA {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] =
        h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] :
            h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255, a: 1 };
}

export function toRgba(color: string): RGBA | undefined {
    let ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return undefined;

    ctx.fillStyle = '#000';
    ctx.fillStyle = color;
    const out = String(ctx.fillStyle); // "#rrggbb" | "rgba(r, g, b, a)"

    if (out.startsWith('#')) {
        const n = parseInt(out.slice(1), 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
    }

    const p = out.match(/[\d.]+/g);
    if (!p || p.length < 3) return undefined;
    const [r, g, b] = p.map(Number);
    return { r, g, b, a: parseAlpha(p[3]) };
}

// ---------- Contrasto WCAG ----------

export function relativeLuminance({ r, g, b }: RGBA): number {
    const lin = (c: number) => {
        c /= 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrastRatio(c1: RGBA, c2: RGBA): number {
    const l1 = relativeLuminance(c1), l2 = relativeLuminance(c2);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

// ---------- Formattazione ----------

function format(c: RGBA, output: ContrastOptions['output']): string {
    const r = Math.round(c.r), g = Math.round(c.g), b = Math.round(c.b);
    if (output === 'rgb') return `rgb(${r}, ${g}, ${b})`;
    if (output === 'hsl') {
        const { h, s, l } = rgbToHsl({ r, g, b, a: 1 });
        return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

// ---------- Funzione principale ----------

const BLACK: RGBA = { r: 0, g: 0, b: 0, a: 1 };
const WHITE: RGBA = { r: 255, g: 255, b: 255, a: 1 };

/**
 * Restituisce un colore che contrasta con quello dato, o null se il colore non è valido.
 * @example getContrastColor('#90ee90')          // verde scuro
 * @example getContrastColor('rgb(10, 40, 80)')  // azzurro chiaro
 * @example getContrastColor('lightgreen')       // funziona nel browser (colori nominali)
 */
export function getContrastColor(color: string, options: ContrastOptions = {}): string | null {
    const { minContrast = 4.5, mode = 'tinted', output = 'hex' } = options;

    const base = parseCssColor(color);
    if (!base) return null;

    // Il colore è "chiaro" se contrasta meglio col nero che col bianco
    const isLight = contrastRatio(base, BLACK) >= contrastRatio(base, WHITE);
    const fallback = isLight ? BLACK : WHITE;

    if (mode === 'blackWhite') return format(fallback, output);

    // Sposta la luminosità (stessa tinta e saturazione) finché il contrasto è sufficiente
    const hsl = rgbToHsl(base);
    const step = isLight ? -0.01 : 0.01;
    for (let l = hsl.l + step; l >= 0 && l <= 1; l += step) {
        const candidate = hslToRgb({ ...hsl, l });
        if (contrastRatio(base, candidate) >= minContrast) return format(candidate, output);
    }

    // Contrasto non raggiungibile mantenendo la tinta
    return format(fallback, output);
}