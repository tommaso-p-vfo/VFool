/** Chiavi che non devono mai essere attraversate o scritte (prototype pollution). */
const FORBIDDEN_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const splitPath = (path: string): string[] =>
    path.split('.').filter((key) => key.length > 0);

/**
 * Legge un valore da un oggetto seguendo un path anche annidato.
 *
 * @example
 * getNestedProperty<number>({ agent: { id: 5 } }, 'agent.id'); // 5
 */
export function getNestedProperty<T = unknown>(obj: unknown, path: string): T | undefined {
    if (!path) return obj as T;

    return splitPath(path).reduce<unknown>((current, key) => {
        if (current === null || current === undefined) return undefined;
        return (current as Record<string, unknown>)[key];
    }, obj) as T | undefined;
}

/**
 * Imposta un valore in un oggetto seguendo un path anche annidato,
 * creando gli oggetti intermedi mancanti. Muta l'oggetto passato.
 *
 * @example
 * const o = {};
 * setNestedProperty(o, 'agent.id', 5); // o = { agent: { id: 5 } }
 */
export function setNestedProperty(obj: object, path: string, value: unknown): void {
    const keys = splitPath(path);
    const lastKey = keys.pop();
    if (lastKey === undefined) return;

    if (FORBIDDEN_KEYS.has(lastKey) || keys.some((k) => FORBIDDEN_KEYS.has(k))) {
        throw new Error(`setNestedProperty: path non consentito "${path}"`);
    }

    const target = keys.reduce<Record<string, unknown>>((current, key) => {
        const next = current[key];
        // Crea il livello se manca o se non è un oggetto (es. primitivo)
        if (next === null || typeof next !== 'object') {
            current[key] = {};
        }
        return current[key] as Record<string, unknown>;
    }, obj as Record<string, unknown>);

    target[lastKey] = value;
}

/**
 * Compone un path puntato a partire dai segmenti.
 *
 * @example
 * buildPath('agent', 'address', 'city'); // 'agent.address.city'
 */
export function buildPath(...segments: Array<string | number>): string {
    return segments.join('.');
}