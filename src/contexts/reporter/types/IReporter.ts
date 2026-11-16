import { VfoError } from "../../../types";
import { VfoCaller, VfoMethod } from "../../../types/VfoCallers";
import { VfoSuccess } from "../../../types/VfoSuccess";

export type IReporter = {
    error: IErrorReporter;
    success: ISuccessReporter;
}

/**
 * Callback che l'app fornisce per ricevere gli errori della libreria
 * (toast, logging, Sentry, ecc.).
 */
export type IErrorReporter = (caller: VfoCaller, method: VfoMethod, error: VfoError) => void;

/**
 * Callback che l'app fornisce per gestire il successo di un'operazione della libreria
 * (toast, logging, Sentry, ecc.).
 */
export type ISuccessReporter = (caller: VfoCaller, method: VfoMethod, success: VfoSuccess, callback?: (d: unknown) => Promise<void>) => Promise<void>;


/** Reporter di default: scrive l'errore in console. */
export const consoleErrorReporter: IErrorReporter = (caller: VfoCaller, method: VfoMethod, error: VfoError) => {
    console.error(`[VFO UI KIT - ${caller} - ${method}] (${error.code}) ${error.codeName}: ${error.message}`, error.params ?? '', error.cause ?? '');
};

/** Reporter no stream: ignora l'errore */
export const silentErrorReporter: IErrorReporter = (caller, method, error) => {
};