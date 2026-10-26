import type { GridApi } from "ag-grid-community";
import type { User } from "../../../../types/dto/User";
import type ITranslations from "../../../../locales/ITranslations";

/**
 * metadata privati utilizzati dal sistema a scopi implementativi.
 * Permettono il passaggio alle colonne dei dati necessari al loro funzionamento e renderizzazione.
 * Ad esempio la colonna _actions richiede il tableName (reso obbligatorio perchè di possibile utilità comune) e la gridApi
 */
export type TableInternalMetadata = { 
    agGridDomain: string;
    tableName: string;
    t: ITranslations;
    user?: User;
    gridApi?: GridApi;
    actionHandlerRef: any; //GenericActionHandler ref, per permettere alle azioni di accedere alla gridApi e ad altre funzioni utili (es. refresh tabella dopo azione delete, etc.)
}