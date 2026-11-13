import { ErrorCodeName, ErrorCodes, IErrorReporter, VfoError } from "../types/VfoError";
import { VfoResponse } from "../types/VfoResponse";

/**
 * Crea un {@link VfoError}. Le proprietà opzionali non passate vengono omesse
 * (compatibile con `exactOptionalPropertyTypes`).
 *
 * @example
 * reportError(createError('DATASOURCE_FETCH_FAILED', 'Caricamento dati fallito', { entityName }, err));
 */
export function createError(
    codeName: ErrorCodeName,
    message: string,
    params?: Record<string, unknown>,
    cause?: unknown,
): VfoError {
    const error: VfoError = { code: ErrorCodes[codeName], codeName, message };
    if (params !== undefined) error.params = params;
    if (cause !== undefined) error.cause = cause;
    return error;
}

/**
 * Verifica che un valore sia un {@link VfoError} (utile nei `catch` e nei reporter).
 */
export function isVfoError(value: unknown): value is VfoError {
    if (typeof value !== 'object' || value === null) return false;
    const { code, codeName, message } = value as Record<string, unknown>;
    return (
        typeof codeName === 'string' &&
        Object.hasOwn(ErrorCodes, codeName) &&
        ErrorCodes[codeName as ErrorCodeName] === code &&
        typeof message === 'string'
    );
}

/** Reporter di default: scrive l'errore in console. */
export const consoleErrorReporter: IErrorReporter = (error) => {
    console.error(`[VFO UI KIT - ${error.code}] ${error.codeName}: ${error.message}`, error.params ?? '', error.cause ?? '');
};

/** Reporter no stream: ignora l'errore */
export const silentErrorReporter: IErrorReporter = (error) => {
};

export const vfoCall = async (f: (p?: unknown) => Promise<unknown>, errorCodeName?: ErrorCodeName, errorReporter?: IErrorReporter): Promise<VfoResponse> => {

    try {
        await f();
        return { success: true } as VfoResponse;
    }
    catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e ?? 'vfoCall error');
        const res = {
            success: false,
            error: createError(errorCodeName ?? "GENERIC_ERROR", message, { error: e })
        };
        if (errorReporter) errorReporter(res.error);
        return res; 
    }
    finally {

    }


}