/**
 * Errore non gestito restituito dal backend o generato lato client
 * quando una chiamata fallisce senza una risposta standard.
 *
 * @typeParam T - Tipo del contenuto di `data`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ApiFatalError<T = any> = {
    /** Stato dell'errore */
    status: string;
    /** Codice numerico dell'errore */
    code: number;
    /** Descrizione tecnica dell'errore */
    error: string;
    /** Messaggio da mostrare all'utente */
    message: string;
    /** Dati aggiuntivi sull'errore */
    data: T;
    /** URI della risorsa chiamata */
    uri: string;
}

/**
 * Crea un {@link ApiFatalError} con i campi testuali vuoti e `code` a `0`.
 *
 * @remarks
 * Utile per incapsulare un errore imprevisto (es. un'eccezione di rete)
 * nello stesso formato degli errori del backend.
 *
 * @typeParam T - Tipo del contenuto di `data`.
 * @param data - Dati da allegare all'errore. Se assenti viene usato `{}`.
 * @returns Un nuovo `ApiFatalError`.
 *
 * @example
 * ```ts
 * try {
 *   await fetch(url);
 * } catch (e) {
 *   return createApiFatalError(e);
 * }
 * ```
 */
export function createApiFatalError<T = unknown>(data?: T): ApiFatalError<T | object> {
    return {
        status: '',
        code: 0,
        error: '',
        message: '',
        data: data ?? {},
        uri: '',
    };
}

/**
 * Indica se un valore ha la forma di un {@link ApiFatalError}.
 *
 * @remarks
 * Controlla il tipo di `status`, `code`, `error` e `message` e la presenza di `data`
 * (con qualsiasi valore). Il campo `uri` non viene controllato.
 *
 * @param value - Valore da controllare, ad esempio l'errore intercettato in un `catch`.
 * @returns `true` se il valore è un `ApiFatalError`. Nel ramo `true` TypeScript lo tipizza come tale.
 *
 * @example
 * ```ts
 * catch (e) {
 *   if (isApiFatalError(e)) toast.error(e.message);
 * }
 * ```
 */
export function isApiFatalError(value: unknown): value is ApiFatalError {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
        typeof obj.status === 'string' &&
        typeof obj.code === 'number' &&
        typeof obj.error === 'string' &&
        typeof obj.message === 'string' &&
        'data' in obj
    );
}