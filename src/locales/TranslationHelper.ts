/**
 * Legge un valore annidato da un oggetto di traduzioni seguendo un percorso separato da punti.
 *
 * @remarks
 * Restituisce `undefined` se `path` è vuoto o se un segmento del percorso non esiste.
 * Non lancia mai eccezioni.
 *
 * @typeParam T - Tipo atteso del valore restituito.
 * @param translations - Oggetto delle traduzioni della lingua corrente.
 * @param path - Percorso del valore, ad esempio `"configuration.tenderTypes.columns"`.
 * @returns Il valore trovato, oppure `undefined`.
 *
 * @example
 * ```ts
 * const columns = getTranslation<Record<string, string>>(
 *   it,
 *   'configuration.tenderTypes.columns',
 * );
 * // → { code: 'Codice', description: 'Descrizione' }
 * ```
 *
 * @example Percorso inesistente
 * ```ts
 * getTranslation(it, 'foo.bar'); // → undefined
 * ```
 */
export function getTranslation<T = unknown>(
    translations: unknown,
    path: string | undefined,
): T | undefined {
    if (!path) return undefined;
    return path
        .split('.')
        .reduce<unknown>(
            (current, key) => (current as Record<string, unknown> | undefined)?.[key],
            translations,
        ) as T | undefined;
}