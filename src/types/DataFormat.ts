/**
 * Formati di visualizzazione supportati per i valori (celle di GenericTable, campi, ecc.).
 *
 * @example
 * import { DataFormat, type DataFormatType } from '@vfo/vfool';
 *
 * const format: DataFormatType = DataFormat.CURRENCY; // 'CURRENCY'
 */
export const DataFormat = {
    CURRENCY: 'CURRENCY',
    DATE: 'DATE',
    PERCENTAGE: 'PERCENTAGE',
    BOOLEAN: 'BOOLEAN',
    COLOR: 'COLOR',
} as const;

/** Unione dei formati: `'CURRENCY' | 'DATE' | 'PERCENTAGE' | 'BOOLEAN' | 'COLOR'`. */
export type DataFormatType = (typeof DataFormat)[keyof typeof DataFormat];

/** Verifica a runtime che un valore sia un formato valido (utile per dati da API o config). */
export function isDataFormat(value: unknown): value is DataFormatType {
    return (Object.values(DataFormat) as readonly unknown[]).includes(value);
}