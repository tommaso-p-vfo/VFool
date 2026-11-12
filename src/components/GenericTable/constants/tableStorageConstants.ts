/**
 * Chiavi di storage usate dai componenti di VFool (GenericTable, layout, filtri).
 *
 * Le applicazioni possono estenderle con le proprie chiavi:
 *
 * @example
 * import { STORAGE_KEYS } from '@vfo/vfool';
 *
 * export const APP_STORAGE_KEYS = {
 *     ...STORAGE_KEYS,
 *     PENDING_CONTRACT: 'pendingContract',
 * } as const;
 */
export const TABLE_STORAGE_KEYS = {
    USER_COLUMN_SETTINGS: 'userColumnSettings',
    COLUMN_DETAILS: 'columnDetails',
    
    QUICK_SEARCH_FILTER: 'quickSearchFilter',
    USER_FILTER: 'userFilter',
    USER_FILTER_ADDITIONAL_DETAILS: 'columnFilterAdditionalDetails',

    PAGESIZE_PREFERENCE: 'pageSizePreference',
    SELECTED_ROW: 'selectedRow',
    CURRENT_PAGE: 'currentPage',
    /** Filtro "solo i miei record". */
    ONLY_MINE_FILTER: 'showOnlyMineFilter',

    // --- Filtri ---
    /**
     * Filtro attivato dall'esterno tramite un'azione dell'utente
     * (es. click su "trattative attive" da un'altra pagina). Contiene lo state del filtro.
     */
    FILTER_STATE: 'externalFilterState',

    // --- Layout ---
    TAB: 'tab',
    COLLAPSE_SIDEBAR: 'collapseSidebar',
} as const;

/** Nome di una chiave di storage di VFool (es. `'COLUMN_PREFERENCES'`). */
export type TableStorageKeyName = keyof typeof TABLE_STORAGE_KEYS;

/** Valore di una chiave di storage di VFool (es. `'columnPreferences'`). */
export type TableStorageKey = (typeof TABLE_STORAGE_KEYS)[TableStorageKeyName];