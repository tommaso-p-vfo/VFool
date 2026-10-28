import type { FilterModel } from './FilterModel';
import type { SortModel } from './SortModel';

/**
 * Richiesta di una pagina di dati al backend.
 *
 * @typeParam TData - Tipo dei parametri aggiuntivi in `data`.
 *
 * @example
 * ```ts
 * const request: PageRequest = {
 *   pageNumber: 1,
 *   pageSize: 20,
 *   select: ['id', 'name'],
 * };
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PageRequest<TData = any> {
    /** Numero della pagina richiesta */
    pageNumber: number;

    /** Numero di elementi per pagina */
    pageSize: number;

    /**
     * Filtri da applicare.
     *
     * @remarks
     * In query string diventa `filter[totalActivities]=[5]&filter[displayOrder]=[1,10]`.
     */
    filter?: FilterModel;

    /**
     * Ordinamento.
     *
     * @remarks
     * In query string diventa `sort=name_ASC,displayOrder_ASC`.
     */
    sort?: SortModel;

    /** Campi da restituire (projection lato backend). Se assente, vengono restituiti tutti i campi. */
    select?: string[];

    /** Parametri aggiuntivi specifici del servizio. */
    data?: TData;
}

/**
 * Informazioni di paginazione restituite dal backend.
 */
export interface PagePagination {
    /** Numero della pagina corrente */
    pageNumber: number;
    /** Numero totale di pagine */
    totalPages: number;
    /** Numero totale di elementi, su tutte le pagine */
    totalCount: number;
    /** `true` se esiste una pagina precedente */
    hasPreviousPage: boolean;
    /** `true` se esiste una pagina successiva */
    hasNextPage: boolean;
}

/**
 * Pagina di dati restituita dal backend.
 *
 * @typeParam T - Tipo degli elementi.
 *
 * @example
 * ```ts
 * const { items, ...pagination } = response; // pagination: PagePagination
 * ```
 */
export interface PageResponse<T> extends PagePagination {
    /** Elementi della pagina corrente */
    items: T[];
}