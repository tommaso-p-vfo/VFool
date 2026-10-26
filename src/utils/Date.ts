const TIME_OPTIONS: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
};

const MONTH_NAMES = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
] as const;

/** Valori accettati dalle funzioni di formattazione delle date. */
export type DateInput = string | Date | null | undefined;

// ─── Funzioni interne ─────────────────────────────────────────────────────────

function toValidDate(value: DateInput): Date | null {
    if (value == null || value === '') return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function pad(n: number): string {
    return n.toString().padStart(2, '0');
}

function formatDateParts(
    value: DateInput,
    order: 'dmy' | 'ymd',
    includeTime: boolean,
    separator: string,
): string {
    const date = toValidDate(value);
    if (!date) return '';

    const d = pad(date.getDate());
    const m = pad(date.getMonth() + 1);
    const y = date.getFullYear().toString();
    const datePart = (order === 'dmy' ? [d, m, y] : [y, m, d]).join(separator);

    return includeTime
        ? `${datePart} ${date.toLocaleTimeString('it-IT', TIME_OPTIONS)}`
        : datePart;
}

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Formatta una data nel formato italiano `gg/mm/aaaa`, con l'ora opzionale.
 *
 * @remarks
 * Restituisce una stringa vuota se il valore è assente o non è una data valida.
 *
 * @param value - Data come stringa ISO o oggetto `Date`.
 * @param includeTime - Se `true` aggiunge l'ora nel formato `HH:mm`.
 * @param separator - Separatore tra giorno, mese e anno.
 * @returns La data formattata, oppure `''`.
 *
 * @example
 * ```ts
 * formatDate('2026-10-26T14:30:00');        // → '26/10/2026'
 * formatDate('2026-10-26T14:30:00', true);  // → '26/10/2026 14:30'
 * formatDate('2026-10-26', false, '-');     // → '26-10-2026'
 * ```
 */
export function formatDate(value: DateInput, includeTime = false, separator = '/'): string {
    return formatDateParts(value, 'dmy', includeTime, separator);
}

/**
 * Formatta una data nel formato `aaaa/mm/gg`, con l'ora opzionale.
 *
 * @remarks
 * Restituisce una stringa vuota se il valore è assente o non è una data valida.
 *
 * @param value - Data come stringa ISO o oggetto `Date`.
 * @param includeTime - Se `true` aggiunge l'ora nel formato `HH:mm`.
 * @param separator - Separatore tra anno, mese e giorno.
 * @returns La data formattata, oppure `''`.
 *
 * @example
 * ```ts
 * formatDateEng('2026-10-26');            // → '2026/10/26'
 * formatDateEng('2026-10-26', false, '-'); // → '2026-10-26'
 * ```
 */
export function formatDateEng(value: DateInput, includeTime = false, separator = '/'): string {
    return formatDateParts(value, 'ymd', includeTime, separator);
}

/**
 * Estrae l'ora da una data nel formato `HH:mm` (24 ore).
 *
 * @param value - Data come stringa ISO o oggetto `Date`.
 * @returns L'ora formattata, oppure `''` se la data non è valida.
 *
 * @example
 * ```ts
 * formatTime('2026-10-26T14:30:00'); // → '14:30'
 * ```
 */
export function formatTime(value: DateInput): string {
    const date = toValidDate(value);
    return date ? date.toLocaleTimeString('it-IT', TIME_OPTIONS) : '';
}

/**
 * Restituisce la data di inizio e di fine di un periodo (anno, mese o giorno).
 *
 * @remarks
 * - Solo `year`: dal 1° gennaio al 31 dicembre.
 * - `year` e `month`: dal primo all'ultimo giorno del mese.
 * - `year`, `month` e `day`: l'intera giornata.
 *
 * `fromDate` è a mezzanotte, `toDate` alle 23:59:59.999 (ora locale).
 *
 * @param year - Anno, es. `2026`.
 * @param month - Mese da 1 a 12.
 * @param day - Giorno del mese.
 * @returns Un oggetto con `fromDate` e `toDate`.
 *
 * @example
 * ```ts
 * getRangeDateFromPeriod(2026, 2);
 * // → { fromDate: 1 feb 2026 00:00, toDate: 28 feb 2026 23:59:59.999 }
 * ```
 */
export function getRangeDateFromPeriod(
    year: number,
    month?: number,
    day?: number,
): { fromDate: Date; toDate: Date } {
    const startMonth = month ? month - 1 : 0;
    const startDay = day ?? 1;

    const endMonth = month ? month - 1 : 11;
    // il giorno 0 del mese successivo è l'ultimo giorno del mese corrente
    const endDay = day ?? new Date(year, endMonth + 1, 0).getDate();

    return {
        fromDate: new Date(year, startMonth, startDay),
        toDate: new Date(year, endMonth, endDay, 23, 59, 59, 999),
    };
}

/**
 * Restituisce il nome italiano di un mese.
 *
 * @param month - Mese da **1 a 12**. Con `Date.getMonth()` (0-11) aggiungi 1.
 * @returns Il nome del mese, oppure `''` se il numero non è valido.
 *
 * @example
 * ```ts
 * getMonthName(1);                    // → 'Gennaio'
 * getMonthName(date.getMonth() + 1);  // mese corrente
 * ```
 */
export function getMonthName(month: number): string {
    return MONTH_NAMES[month - 1] ?? '';
}