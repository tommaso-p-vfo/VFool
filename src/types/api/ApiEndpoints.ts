/**
 * Operazioni standard esposte dai servizi backend.
 *
 * @remarks
 * Permettono di scrivere componenti generici che non conoscono il servizio specifico:
 * ad esempio `GenericTable` usa `LIST` per caricare le righe.
 * Ogni valore è il suffisso che viene aggiunto al percorso base del servizio.
 *
 * @see {@link createCrudEndpoints} per generare gli endpoint CRUD di un servizio.
 *
 * @example
 * ```ts
 * SERVICE_ENDPOINT.LIST; // → 'list'
 * ```
 */
export const SERVICE_ENDPOINT = {
    /** Dettaglio di un singolo elemento */
    GET: 'get',
    /** Elenco di elementi */
    LIST: 'list',
    /** Modifica di un elemento esistente */
    UPDATE: 'update',
    /** Creazione di un nuovo elemento */
    SAVE: 'save',
    /** Eliminazione di un elemento */
    DELETE: 'delete',
    /** Download di un file associato */
    DOWNLOAD: 'download',
    /** Dati riepilogativi */
    SUMMARY: 'summary',
    /** Esportazione dei dati */
    EXPORT: 'export',
} as const;

/** Nome di un'operazione di servizio: `'GET' | 'LIST' | ...` */
export type ServiceEndpointKey = keyof typeof SERVICE_ENDPOINT;

/** Operazioni incluse negli endpoint CRUD. */
export type CrudEndpointKey = 'GET' | 'LIST' | 'UPDATE' | 'SAVE' | 'DELETE';

/**
 * Endpoint CRUD di un servizio, con i percorsi completi come tipi letterali.
 *
 * @typeParam TBase - Percorso base del servizio.
 */
export type CrudEndpoints<TBase extends string> = {
    readonly [K in CrudEndpointKey]: `${TBase}.${(typeof SERVICE_ENDPOINT)[K]}`;
};