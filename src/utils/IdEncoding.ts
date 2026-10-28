/**
 * Offusca un id numerico per l'uso negli URL (Base64 senza padding).
 *
 * ⚠️ Non è un hash né una cifratura: è reversibile da chiunque.
 * Usare solo per evitare id "nudi" negli URL, mai per sicurezza.
 * L'output è già URL-safe (con sole cifre in input non compaiono '+' o '/').
 *
 * @example
 * encodeId(123); // 'MTIz'
 */
export function encodeId(id: number): string {
    return btoa(String(id)).replace(/=/g, '');
}

/**
 * Decodifica un valore prodotto da {@link encodeId}.
 * Restituisce `null` se la stringa non è valida.
 *
 * @example
 * decodeId('MTIz'); // 123
 * decodeId('xyz!'); // null
 */
export function decodeId(encoded: string): number | null {
    try {
        const id = Number.parseInt(atob(encoded), 10);
        return Number.isNaN(id) ? null : id;
    } catch {
        return null;
    }
}