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
export const AG_GRID_STORAGE_KEYS = {
    // --- Tabella (GenericTable / ColumnChooser) ---
    /** Preferenze colonne dell'utente salvate tramite ColumnChooser. */
    COLUMN_PREFERENCES: 'columnPreferences',
    /** Impostazioni della griglia dell'utente (ordine, larghezze, visibilità). */
    COLUMN_DETAILS: 'columnDetails',
    COLUMN_FILTER_PREFERENCES: 'columnFilterPreferences',
    COLUMN_FILTER_DETAILS: 'columnFilterDetails',
    COLUMN_CURRENT_QUICK_FILTER: 'columnCurrentQuickFilter',
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
export type AgGridStorageKeyName = keyof typeof AG_GRID_STORAGE_KEYS;

/** Valore di una chiave di storage di VFool (es. `'columnPreferences'`). */
export type AgGridStorageKey = (typeof AG_GRID_STORAGE_KEYS)[AgGridStorageKeyName];