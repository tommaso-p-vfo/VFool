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

/**
 * Crea gli endpoint CRUD di un servizio a partire dal suo percorso base.
 *
 * @remarks
 * Genera solo le operazioni `GET`, `LIST`, `UPDATE`, `SAVE` e `DELETE`.
 * Le operazioni `DOWNLOAD`, `SUMMARY` ed `EXPORT` vanno composte a mano
 * con {@link SERVICE_ENDPOINT}, perché non tutti i servizi le espongono.
 *
 * @typeParam TBase - Percorso base del servizio, dedotto dall'argomento.
 * @param basePath - Percorso base, separato da punti (es. `"configuration.tenderTypes"`).
 * @returns Un oggetto in sola lettura con i percorsi completi di ogni operazione.
 *
 * @example
 * ```ts
 * const tenderTypes = createCrudEndpoints('configuration.tenderTypes');
 *
 * tenderTypes.LIST; // → 'configuration.tenderTypes.list'
 * tenderTypes.SAVE; // → 'configuration.tenderTypes.save'
 * ```
 *
 * @example Aggiungere un'operazione non CRUD
 * ```ts
 * const contracts = {
 *   ...createCrudEndpoints('contracts'),
 *   EXPORT: `contracts.${SERVICE_ENDPOINT.EXPORT}`,
 * } as const;
 * ```
 */
export function createCrudEndpoints<TBase extends string>(
    basePath: TBase,
): CrudEndpoints<TBase> {
    return {
        GET: `${basePath}.${SERVICE_ENDPOINT.GET}`,
        LIST: `${basePath}.${SERVICE_ENDPOINT.LIST}`,
        UPDATE: `${basePath}.${SERVICE_ENDPOINT.UPDATE}`,
        SAVE: `${basePath}.${SERVICE_ENDPOINT.SAVE}`,
        DELETE: `${basePath}.${SERVICE_ENDPOINT.DELETE}`,
    };
}