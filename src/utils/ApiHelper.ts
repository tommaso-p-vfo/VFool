import { CrudEndpoints, SERVICE_ENDPOINT } from "../constants/apiConstants";

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