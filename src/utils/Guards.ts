/**
 * Indica se il valore è `null`, `undefined` o una stringa vuota.
 *
 * @remarks
 * Il confronto con la stringa vuota è stretto: `0` e `false` restituiscono `false`.
 * Le stringhe composte solo da spazi non sono considerate vuote.
 *
 * @param value - Valore da controllare.
 * @returns `true` se il valore è assente o vuoto. Nel ramo `false` TypeScript lo restringe a `string`.
 *
 * @example
 * ```ts
 * isNullEmptyOrUndefined('');     // → true
 * isNullEmptyOrUndefined(null);   // → true
 * isNullEmptyOrUndefined('ciao'); // → false
 * ```
 */
export function isNullEmptyOrUndefined(
    value: string | null | undefined,
): value is null | undefined | '' {
    return value == null || value === '';
}

/**
 * Indica se un oggetto è `null`, `undefined` o privo di proprietà proprie.
 *
 * @param obj - Oggetto da controllare.
 * @returns `true` se l'oggetto è assente o non ha chiavi.
 *
 * @example
 * ```ts
 * isEmptyObject({});         // → true
 * isEmptyObject({ a: 1 });   // → false
 * ```
 */
export function isEmptyObject(obj: object | null | undefined): boolean {
    return obj == null || Object.keys(obj).length === 0;
}

/**
 * Indica se il valore è un booleano.
 *
 * @param value - Valore da controllare.
 * @returns `true` se il valore è `true` o `false`.
 */
export function isBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}