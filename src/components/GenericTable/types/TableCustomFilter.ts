import { type FilterModel } from "../../../types/api/FilterModel";
import { type AuditFields } from "../../../types/api/AuditFields";

/**
 * Filtro personalizzato di un utente, così come restituito dalle API.
 */
export type TableCustomFilterDto = AuditFields & {
    id: number;
    userId: number;
    userFullName: string;
    /** Nome dell'entità (griglia) a cui si applica il filtro. */
    entityName: string;
    isDefault: boolean;
    name: string | undefined;
    /**
     * Definizione del filtro: oggetto già deserializzato, stringa JSON
     * così come arriva dal server, oppure `null` se assente.
     */
    definition: FilterModel | string | null;
};

/**
 * Stato lato client di un filtro personalizzato (non persistito sul server).
 */
export type TableCustomFilterUiState = {
    /** Filtro temporaneo, non salvato nel database. */
    _isTemporary: boolean;
    /** Filtro modificato rispetto alla versione salvata. */
    _isModified: boolean;
    /** Filtro candidato a essere salvato come nuovo. */
    _isCandidateForNew: boolean;
    /** Filtro nuovo, non ancora salvato. */
    _isNew: boolean;
};

/**
 * Filtro personalizzato usato dai componenti: dati API + stato UI.
 */
export type TableCustomFilter = TableCustomFilterDto & TableCustomFilterUiState;