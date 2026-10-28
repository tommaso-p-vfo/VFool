import type { BulkItem, BulkFlag } from '../types/BulkItem';

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

/**
 * Applies the bulk edits made in the UI to a field's list of values and
 * returns the list that results.
 *
 * Starting from `values`:
 * 1. every value matching the `keyField` of an item marked `isDeleted` is removed;
 * 2. the `keyField` of every item marked `isAdded` is appended.
 *
 * @param id - ID of the form field the values belong to. Currently **unused**,
 *   kept for API compatibility.
 * @param values - Current values of the field: a list of keys
 *   (e.g. `[1, 2, 3]` if `keyField` is `'id'`).
 * @param keyField - Name of the property of `item` used to match the bulk
 *   items against `values` (e.g. `'id'`, `'name'`).
 * @param bulkItems - Edits made by the user. If it is `null` or `undefined`,
 *   `values` is returned unchanged.
 *
 * @returns The updated list of keys: the original values that were not
 * deleted, in their original order, followed by the added keys. Returns
 * `undefined` if the resulting list is empty.
 *
 * @remarks
 * - Items marked `isChanged` do not affect the result: only keys are
 *   tracked, and an edit does not change membership.
 * - Duplicates are not removed. If an added key is already in `values`,
 *   it appears twice.
 * - Keys are compared with strict equality (`includes`), so `1` and `'1'`
 *   do not match.
 *
 * @example
 * ```ts
 * const result = getUpdatedFieldValues('tags', [1, 2, 3], 'id', [
 *   { item: { id: 2 }, isAdded: false, isChanged: false, isDeleted: true },
 *   { item: { id: 7 }, isAdded: true,  isChanged: false, isDeleted: false },
 * ]);
 * // result → [1, 3, 7]
 * ```
 *
 * @public
 */
export const getUpdatedFieldValues = (id: string, values: any[], keyField: string, bulkItems: BulkItem<any>[]) => {

    if (!bulkItems) return values;

    // Keys of the items the user deleted
    let deleted = bulkItems.filter(bi => bi.isDeleted).map(bi => bi.item[keyField]);
    let unchanged = values.filter(key => !deleted.includes(key));

    // Keys of the items the user added
    let news = bulkItems.filter(bi => bi.isAdded).map(bi => bi.item[keyField]);

    // Merge: kept values followed by new ones
    let _values = [...unchanged, ...news];
    return _values.length > 0 ? _values : undefined;

};