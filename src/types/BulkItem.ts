/**
 * Wraps an entity edited in the UI and records what the user did to it, so the
 * caller knows which service to call when saving in bulk (create, update or delete).
 *
 * @typeParam T - Type of the wrapped entity.
 *
 * @remarks
 * The three flags are meant to be used one at a time. The type does not stop
 * them being set together, so check them in a fixed order
 * (`isDeleted` → `isAdded` → `isChanged`) when one item has more than one set.
 *
 * @example
 * ```ts
 * const row: BulkItem<User> = {
 *   item: { id: 42, name: 'Mario' },
 *   isAdded: false,
 *   isChanged: true,
 *   isDeleted: false,
 * };
 * ```
 *
 * @public
 */
export type BulkItem<T> = {
    /** The entity being edited. */
    item: T;
    /** `true` if the user created the entity and it is not yet saved. */
    isAdded: boolean;
    /** `true` if the user changed an entity that already exists. */
    isChanged: boolean;
    /** `true` if the user marked the entity for deletion. */
    isDeleted: boolean;
};

/**
 * Type guard that checks at runtime whether a value has the shape of a {@link BulkItem}.
 *
 * @param obj - Value to check.
 * @returns `true` if `obj` is a non-null object with an `item` property and
 * the three boolean flags `isAdded`, `isChanged` and `isDeleted`.
 *
 * @remarks
 * Only the shape of the wrapper is checked. The type of `item` is not, so the
 * narrowed type is `BulkItem<any>`.
 *
 * @example
 * ```ts
 * if (isBulkItem(value)) {
 *   console.log(value.item);
 * }
 * ```
 *
 * @public
 */
export function isBulkItem(obj: any): obj is BulkItem<any> {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        'item' in obj &&
        'isAdded' in obj &&
        'isChanged' in obj &&
        'isDeleted' in obj &&
        typeof obj.isAdded === 'boolean' &&
        typeof obj.isChanged === 'boolean' &&
        typeof obj.isDeleted === 'boolean'
    );
}

/**
 * Checks whether two {@link BulkItem}s wrap the same entity by comparing
 * their `item` payloads structurally.
 *
 * @param a - First item.
 * @param b - Second item.
 * @returns `true` if the JSON serialisations of `a.item` and `b.item` are identical.
 *
 * @remarks
 * - The `isAdded` / `isChanged` / `isDeleted` flags are **not** compared.
 * - The comparison uses `JSON.stringify`, so it depends on **property order**
 *   (`{ a: 1, b: 2 }` is not equal to `{ b: 2, a: 1 }`). Properties that
 *   `JSON.stringify` drops (`undefined`, functions, symbols) are ignored,
 *   and a `Date` is compared by its ISO string.
 *
 * @public
 */
export const isBulkItemEquals = (a: BulkItem<any>, b: BulkItem<any>): boolean => {
    return JSON.stringify(a.item) === JSON.stringify(b.item);
};

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