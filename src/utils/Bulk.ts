import type { BulkItem } from '../types/BulkItem';

/** Stato di una riga in un salvataggio massivo. */
export type BulkFlag = 'new' | 'changed' | 'deleted';

/**
 * Converte un oggetto in un {@link BulkItem} per i salvataggi massivi.
 *
 * @remarks
 * L'elemento viene copiato (copia superficiale), quindi modificare `item` non altera `data`.
 *
 * @typeParam T - Tipo dell'elemento.
 * @param prop - Se indicata, l'elemento viene letto da `data[prop]`; altrimenti si usa `data`.
 * @param flag - Stato della riga: `'new'`, `'changed'` o `'deleted'`.
 * @param data - Oggetto sorgente.
 * @returns Il `BulkItem` con i flag impostati.
 *
 * @example
 * ```ts
 * toBulkItem(undefined, 'new', { name: 'Nuovo' });
 * // → { item: { name: 'Nuovo' }, isAdded: true, isChanged: false, isDeleted: false }
 *
 * // con AG Grid: legge l'elemento da event.data
 * toBulkItem('data', 'changed', event);
 * ```
 */
export function toBulkItem<T extends object = Record<string, unknown>>(
    prop: string | undefined,
    flag: BulkFlag,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any,
): BulkItem<T> {
    const value = prop ? data[prop] : data;
    return {
        item: { ...value },
        isAdded: flag === 'new',
        isChanged: flag === 'changed',
        isDeleted: flag === 'deleted',
    } as BulkItem<T>;
}