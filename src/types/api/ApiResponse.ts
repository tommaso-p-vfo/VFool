/**
 * Risposta standard di una chiamata al backend.
 *
 * @typeParam T - Tipo del contenuto di `data`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiResponse<T = any> {
    /** `true` se la chiamata è andata a buon fine */
    success: boolean;
    /** Codice di stato HTTP */
    status: number;
    /** Codice applicativo dell'errore, se presente */
    code?: string;
    /** Descrizione tecnica dell'errore */
    error?: string;
    /** Messaggio da mostrare all'utente */
    message?: string;
    /** Contenuto della risposta */
    data?: T;
    /** URI della risorsa chiamata */
    uri: string;
    /** Nome della risorsa chiamata */
    resourceName: string;
}

/**
 * Esito di una serie di chiamate sequenziali al backend.
 *
 * @typeParam T - Tipo del contenuto di `data` nelle singole risposte.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiMultiResponse<T = any> {
    /** Chiamate andate a buon fine */
    success: ApiResponse<T>[];
    /** Chiamate fallite */
    errors: ApiResponse<T>[];
}