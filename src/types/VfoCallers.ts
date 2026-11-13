import { VfoError } from "./VfoErrors";

/**
 * VFO UI KIT
 * nomi dei servizi gestiti dalla libreria
 * vengono usati per loggare univocamente i servizi
 * utile per interazione esterna tramite con IReporter
 */
export const VfoCallers = {
    APPLY_COLUMN_SETTINGS: 'APPLY_COLUMN_SETTINGS'
};

export type VfoCaller = (typeof VfoCallers)[keyof typeof VfoCallers];

/**
 * risposta dei servizi che resta interno alla libreria
 */
export type VfoResponse = {
    caller: VfoCaller;
    success: boolean;
    error?: VfoError;
}