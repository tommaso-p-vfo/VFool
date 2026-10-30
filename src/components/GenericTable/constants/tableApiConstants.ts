/**
 * Chiavi di API service usate dai componenti di VFool Table (GenericTable, layout, filtri).
 *
 * Le applicazioni possono estenderle con le proprie chiavi:
 *
 * @example
 * import { STORAGE_KEYS } from '@vfo/vfool';
 *
 * export const APP_API_KEYS = {
 *     ...TABLE_API_KEYS,
 *     CONTRACTS: 'contracts',
 * } as const;
 */
export const TABLE_API_KEYS = {
    TABLE_CUSTOM_FILTER: 'tableCustomFilter',
} as const;

/** Nome di una chiave di service API di VFool Table (es. `'TABLE_CUSTOM_FILTER'`). */
export type TableCustomFilterKeyName = keyof typeof TABLE_API_KEYS;

/** Valore di una chiave di service API di VFool Table (es. `'tableCustomFilter'`). */
export type TableCustomFilterKey = (typeof TABLE_API_KEYS)[TableCustomFilterKeyName];