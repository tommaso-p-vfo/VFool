import { VfoCaller, VfoCallers, VfoMethods } from "../types/VfoCallers";
import { ErrorCode, ErrorCodeName, ErrorCodeNames, ErrorCodes, VfoError } from "../types/VfoErrors";

const _getVfoError = (
    caller: VfoCaller,
    method: string, 
    codeName?: ErrorCodeName
) => {

    if(codeName)
        return { code: ErrorCodes[codeName], codeName };

    switch(caller) {

        case VfoCallers.COLUMN_SETTINGS:

            if (method === VfoMethods.READ)
                return _getErrorCodeInfo(ErrorCodes.LOAD_COLUMN_SETTINGS_FAILED);
            if (method === VfoMethods.APPLY || method === VfoMethods.APPLY_AND_SAVE)
                return _getErrorCodeInfo(ErrorCodes.APPLY_COLUMN_SETTINGS_FAILED);
            if (method === VfoMethods.RESET || method === VfoMethods.RESET_AND_SAVE)
                return _getErrorCodeInfo(ErrorCodes.RESET_COLUMN_SETTINGS_FAILED);

            
            break;

        default:
            return _createGenericError(caller, method);

    }

    return _createGenericError(caller, method);
}

const _createGenericError = (caller: VfoCaller, method: string,) => {
    return { code: ErrorCodes.GENERIC_ERROR, codeName: getErrorCodeName() };
}

const _getErrorCodeInfo = (code: ErrorCode) => {
    return {
        code: code,
        codeName: getErrorCodeName(code)
    }
}

/**
 * Crea un {@link VfoError}. Le proprietà opzionali non passate vengono omesse
 * (compatibile con `exactOptionalPropertyTypes`).
 *
 * @example
 * reportError(createError('DATASOURCE_FETCH_FAILED', 'Caricamento dati fallito', { entityName }, err));
 */
export function createError(
    caller: VfoCaller,
    method: string,
    message: string,
    params?: Record<string, unknown>,
    cause?: unknown,
    codeName?: ErrorCodeName
): VfoError {

    const err = _getVfoError(caller, method, codeName);

    const error: VfoError = { code: err.code, codeName: err.codeName, message };
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

export const getErrorCodeName = (errorCode?: ErrorCode): ErrorCodeName => {
    return errorCode !== undefined ? ErrorCodeNames[errorCode] : "GENERIC_ERROR";
}
    