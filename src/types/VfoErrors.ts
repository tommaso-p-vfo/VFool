/**
 * Codici di errore emessi dai componenti di VFool.
 *
 * Convenzione per range:
 * - 1xxx: datasource
 * - 2xxx: impostazioni colonne
 */
export const ErrorCodes = {
    // 1xx – generic
    GENERIC_ERROR: 100,
    // 1xxx – datasource
    DATASOURCE_FETCH_FAILED: 1001,
    // 2xxx – column settings
    APPLY_COLUMN_SETTINGS_FAILED: 2001,
} as const;

/** Nome di un codice di errore (es. `'DATASOURCE_FETCH_FAILED'`). */
export type ErrorCodeName = keyof typeof ErrorCodes;

/** Mappa inversa: codice numerico → nome. */
export const ErrorCodeNames = Object.fromEntries(
    Object.entries(ErrorCodes).map(([name, code]) => [code, name])
) as { [K in ErrorCodeName as (typeof ErrorCodes)[K]]: K };

/** Valore numerico di un codice di errore (es. `1001`). */
export type ErrorCode = (typeof ErrorCodes)[ErrorCodeName];

/** Errore strutturato emesso dalla libreria e passato all'{@link ErrorReporter}. */
export type VfoError = {
    code: ErrorCode;
    codeName: ErrorCodeName;
    message: string;
    /** Dati di contesto (es. `{ entityName: 'contracts' }`). */
    params?: Record<string, unknown>;
    /** Errore originale che ha causato questo errore. */
    cause?: unknown;
};

