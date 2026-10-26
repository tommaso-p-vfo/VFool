import { AppHelper } from './AppHelper';

// ─── Funzioni interne condivise ───────────────────────────────────────────────

function write(storage: Storage, key: string, data: unknown): void {
    storage.setItem(key, JSON.stringify(data));
}

function read<T>(storage: Storage, key: string): T {
    const raw = storage.getItem(key);
    if (AppHelper.isNullEmptyOrUndefined(raw)) return {} as T;
    return JSON.parse(raw as string) as T;
}

function exists(storage: Storage, key: string): boolean {
    return storage.getItem(key) !== null;
}

function remove(storage: Storage, key: string): void {
    storage.removeItem(key);
}

// ─── sessionStorage ───────────────────────────────────────────────────────────

/**
 * Salva un valore in `sessionStorage`, serializzato in JSON.
 *
 * @param key - Chiave sotto cui salvare il valore.
 * @param data - Valore da salvare. Deve essere serializzabile in JSON.
 *
 * @example
 * ```ts
 * saveInSession('filters', { year: 2026, status: 'open' });
 * ```
 */
export function saveInSession(key: string, data: unknown): void {
    write(sessionStorage, key, data);
}

/**
 * Legge un valore da `sessionStorage` e lo deserializza da JSON.
 *
 * @remarks
 * Se la chiave non esiste o è vuota restituisce un oggetto vuoto `{}`.
 * Lancia un `SyntaxError` se il valore salvato non è JSON valido.
 *
 * @typeParam T - Tipo atteso del valore.
 * @param key - Chiave da leggere.
 * @returns Il valore deserializzato, oppure `{}`.
 *
 * @example
 * ```ts
 * const filters = getFromSession<{ year: number }>('filters');
 * ```
 */
export function getFromSession<T = unknown>(key: string): T {
    return read<T>(sessionStorage, key);
}

/**
 * Indica se una chiave esiste in `sessionStorage`.
 *
 * @param key - Chiave da cercare.
 * @returns `true` se la chiave esiste, anche con valore vuoto.
 */
export function existInSession(key: string): boolean {
    return exists(sessionStorage, key);
}

/**
 * Rimuove una chiave da `sessionStorage`. Non fa nulla se la chiave non esiste.
 *
 * @param key - Chiave da rimuovere.
 */
export function removeFromSession(key: string): void {
    remove(sessionStorage, key);
}

// ─── localStorage ─────────────────────────────────────────────────────────────

/**
 * Salva un valore in `localStorage`, serializzato in JSON.
 *
 * @param key - Chiave sotto cui salvare il valore.
 * @param data - Valore da salvare. Deve essere serializzabile in JSON.
 *
 * @example
 * ```ts
 * saveInLocalSession('gridState', columnState);
 * ```
 */
export function saveInLocalSession(key: string, data: unknown): void {
    write(localStorage, key, data);
}

/**
 * Legge un valore da `localStorage` e lo deserializza da JSON.
 *
 * @remarks
 * Se la chiave non esiste o è vuota restituisce un oggetto vuoto `{}`.
 * Lancia un `SyntaxError` se il valore salvato non è JSON valido.
 *
 * @typeParam T - Tipo atteso del valore.
 * @param key - Chiave da leggere.
 * @returns Il valore deserializzato, oppure `{}`.
 *
 * @example
 * ```ts
 * const state = getFromLocalSession<ColumnState[]>('gridState');
 * ```
 */
export function getFromLocalSession<T = unknown>(key: string): T {
    return read<T>(localStorage, key);
}

/**
 * Indica se una chiave esiste in `localStorage`.
 *
 * @param key - Chiave da cercare.
 * @returns `true` se la chiave esiste, anche con valore vuoto.
 */
export function existInLocalSession(key: string): boolean {
    return exists(localStorage, key);
}

/**
 * Rimuove una chiave da `localStorage`. Non fa nulla se la chiave non esiste.
 *
 * @param key - Chiave da rimuovere.
 */
export function removeFromLocalSession(key: string): void {
    remove(localStorage, key);
}

/**
 * Restituisce le chiavi di `localStorage` che contengono il testo indicato.
 *
 * @remarks
 * Il confronto distingue tra maiuscole e minuscole.
 *
 * @param key - Testo da cercare all'interno delle chiavi.
 * @returns Le chiavi trovate, oppure un array vuoto.
 *
 * @example
 * ```ts
 * // rimuove tutti gli stati salvati delle griglie
 * getFromLocalSessionKeysInLike('gridState').forEach(removeFromLocalSession);
 * ```
 */
export function getFromLocalSessionKeysInLike(key: string): string[] {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.includes(key)) keys.push(k);
    }
    return keys;
}