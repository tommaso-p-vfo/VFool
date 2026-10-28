import type { ColumnState } from 'ag-grid-community';
import type { AuditFields } from '../../../types/api/AuditFields';

/**
 * Impostazioni della griglia (colonne, ordine, larghezze, ordinamento) salvate per un utente,
 * così come restituite dalle API.
 */
export type TableCustomSettingDto = AuditFields & {
    id: number;
    userId: number;
    userFullName: string;
    /** Nome dell'entità (griglia) a cui si applicano le impostazioni. */
    entityName: string;
    /**
     * Stato delle colonne AG Grid: array già deserializzato
     * oppure stringa JSON così come arriva dal server.
     */
    settings: string | ColumnState[];
};

/**
 * Stato lato client delle impostazioni griglia (non persistito sul server).
 */
export type TableCustomSettingUiState = {
    /** Impostazioni modificate rispetto alla versione salvata. */
    _isModified?: boolean;
};

/**
 * Impostazioni griglia usate dai componenti: dati API + stato UI.
 */
export type TableCustomSetting = TableCustomSettingDto & TableCustomSettingUiState;