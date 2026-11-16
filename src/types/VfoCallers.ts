import { VfoError } from "./VfoErrors";
import { VfoSuccess } from "./VfoSuccess";

/**
 * VFO UI KIT
 * nomi dei servizi gestiti dalla libreria
 * vengono usati per loggare univocamente i servizi
 * utile per interazione esterna tramite con IReporter
 */
export const VfoCallers = {
    COLUMN_SETTINGS: 'COLUMN_SETTINGS'
};

export type VfoCaller = (typeof VfoCallers)[keyof typeof VfoCallers];

/**
 * VFO UI KIT
 * nomi dei metodi generici gestiti dalla libreria
 * vengono usati per loggare univocamente i servizi
 * utile per interazione esterna tramite con IReporter
 */
export const VfoMethods = {
    APPLY: 'APPLY',
    RESET: 'RESET',
    SAVE: 'SAVE',
    APPLY_AND_SAVE: 'APPLY_AND_SAVE',
    RESET_AND_SAVE: 'RESET_AND_SAVE',
    
    READ: 'READ'
};

export type VfoMethod = (typeof VfoMethods)[keyof typeof VfoMethods];

/**
 * risposta dei servizi che resta interno alla libreria
 */
export type VfoResponse = {
    caller: VfoCaller;
    method: VfoMethod;
    success: boolean;
    successInfo?: VfoSuccess;
    errorInfo?: VfoError;
}