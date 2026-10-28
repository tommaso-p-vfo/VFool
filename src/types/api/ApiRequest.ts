/**
 * Richiesta inviata al backend tramite il service locator.
 *
 * @typeParam TData - Tipo del payload.
 *
 * @example
 * ```ts
 * const request: ApiRequest<{ username: string; password: string }> = {
 *   service: 'auth.login',
 *   data: { username, password },
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ApiRequest<TData = any> {
    /**
     * Nome del servizio: dominio, eventuale sottodominio e operazione, separati da punti.
     *
     * @example `'auth.login'`, `'configuration.tenderTypes.save'`
     */
    service: string;

    /** Payload della richiesta o parametri della query string. */
    data: TData;

    /**
     * Parametri aggiuntivi per il service locator, ad esempio `userId` o `agentId`
     * per filtri specifici come "solo i miei".
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;

    /** Funzione chiamata al termine della richiesta, sia in caso di successo che di errore. */
    finallyCallback?: () => void;
}