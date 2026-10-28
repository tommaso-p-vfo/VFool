/**
 * Campi di audit comuni alle entità restituite dalle API.
 * Riutilizzabile per altre entità tramite intersezione (`MyEntity & AuditFields`).
 */
export type AuditFields = {
    /** Data di creazione in formato ISO 8601. */
    createdAt: string;
    /** Data di ultima modifica in formato ISO 8601. */
    updatedAt: string;
    createdById: number;
    updatedById: number;
    createdByName: string;
    updatedByName: string;
};