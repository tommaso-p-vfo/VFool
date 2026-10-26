import { IdsFormat, type IdsFormatType } from '../types/IdsFormat';
import { formatDate } from './date';

const DEFAULT_COLOR = '#2e7d32';

/**
 * Formatta un numero come percentuale con due decimali e la virgola.
 *
 * @param value - Valore già espresso in percentuale (es. `12.5` per 12,5%).
 * @returns Il valore formattato.
 *
 * @example
 * ```ts
 * formatPercentage(12.5); // → '12,50%'
 * ```
 */
export function formatPercentage(value: number): string {
    return `${value.toFixed(2).replace('.', ',')}%`;
}

/**
 * Converte un booleano in `'Si'` o `'No'`.
 *
 * @param value - Valore da convertire.
 * @returns `'Si'` se `true`, altrimenti `'No'`.
 */
export function formatBoolean(value: boolean): string {
    return value ? 'Si' : 'No';
}

/**
 * Genera il markup SVG di un quadratino colorato, da usare come anteprima di un colore.
 *
 * @remarks
 * Restituisce una **stringa HTML**: va inserita con `innerHTML` o con un cell renderer
 * che accetta HTML. Il colore non viene validato, quindi passa solo valori fidati.
 * Se il colore è vuoto viene usato `#2e7d32`.
 *
 * @param color - Colore CSS (es. `'#ff0000'`, `'red'`).
 * @param size - Lato del quadrato in pixel.
 * @returns Il markup SVG.
 *
 * @example
 * ```ts
 * formatColor('#1976d2');     // quadrato blu 10×10
 * formatColor('#1976d2', 16); // quadrato blu 16×16
 * ```
 */
export function formatColor(color: string, size = 10): string {
    return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
        `<rect width="${size}" height="${size}" rx="2" fill="${color || DEFAULT_COLOR}"/>` +
        `</svg>`
    );
}

/**
 * Formatta un numero come valuta.
 *
 * @param value - Importo da formattare.
 * @param locale - Impostazioni locali per separatori e posizione del simbolo.
 * @param currency - Codice ISO 4217 della valuta.
 * @returns L'importo formattato, sempre con due decimali.
 *
 * @example
 * ```ts
 * formatCurrency(12345.6);                 // → '12.345,60 €'
 * formatCurrency(12345.6, 'en-US', 'USD'); // → '$12,345.60'
 * ```
 */
export function formatCurrency(value: number, locale = 'it-IT', currency = 'EUR'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

/**
 * Formatta una dimensione in byte nell'unità più leggibile (B, KB, MB).
 *
 * @param bytes - Dimensione in byte.
 * @returns La dimensione formattata, con un decimale per KB e MB.
 *
 * @example
 * ```ts
 * formatBytes(512);     // → '512 B'
 * formatBytes(2048);    // → '2.0 KB'
 * formatBytes(5242880); // → '5.0 MB'
 * ```
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formatta un valore in base al tipo di formato indicato.
 *
 * @remarks
 * Usata dai componenti generici (es. le colonne di `GenericTable`) quando il formato
 * arriva dalla configurazione. Se il formato non è gestito, il valore viene restituito invariato.
 *
 * @typeParam T - Tipo del valore in ingresso.
 * @param data - Valore da formattare.
 * @param format - Formato da applicare.
 * @returns Il valore formattato come stringa, oppure il valore originale.
 *
 * @example
 * ```ts
 * formatAs(0.5, IdsFormat.PERCENTAGE);        // → '0,50%'
 * formatAs('2026-10-26', IdsFormat.DATE);     // → '26/10/2026'
 * // con un formato non gestito restituisce il valore così com'è
 * ```
 */
export function formatAs<T>(data: T, format: IdsFormatType): string | T {
    switch (format) {
        case IdsFormat.DATE:
            return formatDate(data as string);
        case IdsFormat.CURRENCY:
            return formatCurrency(data as number);
        case IdsFormat.PERCENTAGE:
            return formatPercentage(data as number);
        case IdsFormat.BOOLEAN:
            return formatBoolean(data as boolean);
        case IdsFormat.COLOR:
            return formatColor(data as string);
        default:
            return data;
    }
}