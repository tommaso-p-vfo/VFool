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