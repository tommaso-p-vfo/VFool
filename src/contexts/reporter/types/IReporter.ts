import { VfoError } from "../../../types";
import { VfoCaller } from "../../../types/VfoCallers";
import { VfoSuccess } from "../../../types/VfoSuccess";

export type IReporter = {
    error: IErrorReporter;
    success: ISuccessReporter;
}

/**
 * Callback che l'app fornisce per ricevere gli errori della libreria
 * (toast, logging, Sentry, ecc.).
 */
export type IErrorReporter = (caller: VfoCaller, method: string, error: VfoError) => void;

/**
 * Callback che l'app fornisce per gestire il successo di un'operazione della libreria
 * (toast, logging, Sentry, ecc.).
 */
export type ISuccessReporter = (caller: VfoCaller, method: string, success: VfoSuccess, callback?: (d: unknown) => Promise<void>) => Promise<void>;