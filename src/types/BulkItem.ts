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


/** Stato di una riga in un salvataggio massivo. */
export type BulkFlag = 'new' | 'changed' | 'deleted';