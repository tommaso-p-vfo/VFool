import { TableContextHandler } from "../contexts/TableContext";
import { FilterModel, IComponentRegistry, IServiceLocator, PageRequest } from "../../../types";
import { JSX } from "react/jsx-runtime";
import { ThemeColor, ThemeVariant } from "../../../utils";
import { GridApi } from "ag-grid-community";
import { TableColumnType } from "../constants/tableConstants";

/**
 * Interfaccia per definire gli attributi di una tabella attraverso React
 * Questa interfaccia è generica e può essere utilizzata per qualsiasi tipo di tabella,
 * specificando il tipo degli oggetti contenuti nella tabella.
 * 
 * @template T - Il tipo degli oggetti contenuti nella tabella.
 * @property {TableMetadata} metadata - Metadati della tabella, come il nome della tabella, le traduzioni delle colonne e gli eventi associati.     
 * 
 */
export interface TableAttributes<T> {
    dataConnector: TableDataConnector;
    appearance?: TableApperance;
    translations?: TableTranslations;

    quickSearch?: QuickSearchConfig;
    columns?: { [colName: string]: TableColumnConfig; }; // TODO _actions: boolean; }
    actions?: { [actionName: string]: TableActionConfig<T>; };
    summary?: TableSummaryConfig;

    /**
     * se una action si affida a un manager predefinito della libreria
     * deve esistere un componente nel registro con una property 
     * che abbia come name '<domain>.<TABLE_ACTION_MANAGER_NAME>'
     * che risponda alle esigenze dell'azione.
     * 
     * TODO - verifica la firma del componente iniettato finale
     * Il manager chiamerà il componente iniettando le seguenti props
     * <Component 
     *      ref={componentRef} 
     *      data={righe selezionate o undefined se azione globale} 
     *      view={view} 
     *      domain={domain} 
     *      params={params} 
     *      parentRef={genericModalRef} 
     *  />
     */
    componentRegistry?: IComponentRegistry;

    // metadata?: TableMetadata<T>;
}

export type TableHandler = {
    context: TableContextHandler | null;
}

export type TableColumnConfig = {
    type: TableColumnType; //TableColumnType - AG_GRID_TYPE_COLUMN constant
    filter?: { //personalizzazione filtro adv a livello di singola colonna
        enabled?: boolean; //permette di disattivare il filtro esplicitamente
        [filterField: string]: any;
    },
    hide?: boolean, //visualizza o meno la colonna in tabella - default false
    minWidth?: number; //dimensione colonna minima (inizializzazione)
    sortable?: boolean //permette o meno l'ordinamento sulla colonna - default true
    collapsable?: boolean, //rende la colonna collassabile - apre un container al click per la visualizzazione completa - mutualmente esclusivo con copyable
    copyable?: boolean, //rende la cella copiabile negli appunti - mutualmente esclusivo con collapsable
    
    domain?: string; //alcuni tipi colonna (es. COMBOBOX) potrebbero richiedere la fetch di dati dal server tramite dominio
    params?: TableColumnParams; //parametri opzionali da passare alla colonna
    
    protected?: boolean; //colonna non caricata in griglia (a meno che non sia Admin).
    systemColumn?: boolean; //colonna caricata in griglia, non visibile dall'utente (a meno che non sia Admin) ma raggiungibile dalla AG GRID per ragioni di sistema (es. ID).

    // TODO spostare qui la logica
    // protectedColumns?: string[]; //elenco di nomi di colonne che non devono essere visualizzate in nessun modo dall'utente (a meno che non sia Admin).
    // systemColumns?: string[]; //elenco di nomi di colonne che non devono essere visualizzate dall'utente ma devono essere raggiungibili dalla AG GRID (incluse in tabella) per ragioni di sistema
}

export type TableColumnParams = {
    defaultColor?: ThemeColor;
    className?: string;
    placeholder?: string;
    // actionConfig?: _TableActionsConfig;

    [key: string]: any;
}

export type TableDataConnector = {
    domain: string; // Service Domain - Identificatore univoco della tabella (vd. DOMAIN e SUBDOMAIN)
    serviceLocator: IServiceLocator;

    defaultPage?: PageRequest; //numero di elementi per pagina di partenza, ecc.

    maxBlocksInCache?: number; // Ag Grid - Numero massimo di blocchi nella cache per la tabella. Da usare per la gestione della memoria e delle performance.

    extraData?: TableContextExtraData[]; // aggiunge dati serverside al contesto della tabella 

    hasAdminAuthorization?: () => boolean; //default false - conferisce visibilità totale della tabella
}

/** 
 * aggiunge dati serverside al contesto della tabella 
 * disponibili poi in context.data come mappa <name, data>
*/
export type TableContextExtraData = {
    name: string; //nome da assegnare alla collezione di dati
    service: string; //dominio del servizio per la fetch
    params: any; //parametri per la fetch (es. PageRequest type, ecc.)
}

export type QuickSearchConfig = {
    enabled: boolean; //default true
    searchFilterColumns?: string[]; //nome colonne del filtro di ricerca testuale rapido - default 'name' se non impostato.
    preFilter?: FilterModel; //carica la griglia prefiltrata con il seguente filterModel - si applica al campo di 'ricerca rapida' Quick Search
}

export type TableApperance = {
    showHeader?: boolean; //default true
    showNavbar?: boolean; //default true
    showSummary?: boolean; //default true

    icon?: JSX.Element;
    title?: string; //sovrascrive il JSON traduzioni
    subTitle?: string; //sovrascrive il JSON traduzioni

    details?: TableAdditionalDetails;
}

export type TableAdditionalDetails = { //ex GridDetails
    title?: string;
    content: string; //trattato come HTML
}

/**
 * sommario - totali restituiti dalle GET LIST lato server
 */
export type TableSummaryConfig = {
    excludes?: string[]; //lista di proprietà del summary da non visualizzare nella generic table
}

export type TableActionConfig<T> = {

    type: 'button' | 'switch'; //default button
    position: 'topBar-right' | 'topBar-left' | 'action-cell'; //default 'action-cell -- posizione dell'azione nella griglia
    displayOrder?: number; //default 'ordine lista' -- se specificato indica l'ordine di inserimento, partendo da sinistra

    action: TableAction<T>;

    disabled?: (data: T) => boolean; //default false
    hide?: (data: T) => boolean; //default false
}

export type TableAction<T> = {

    name?: string; //ex title - titolo da mostrare nell'header del modal associato all'azione - default inferito da dominio + tipo azione
    icon?: JSX.Element;
    color?: ThemeColor; //CSS color - default primary
    variant?: ThemeVariant; //default filled

    actionManagerConfig?: ActionManagerConfig;
    onClick?: (props: TableActionProps<T>) => Promise<void>; //async function

}

export type ActionManagerConfig = {

    /**
     * manager dell'azione.
     * Cerca nel componentRegistry la chiave <domain>.<TABLE_ACTION_MANAGER_NAME> e visualizza il componente.
     * La visualizzazione può avvenire aprendo il componente in una modal o in una pagina.
     * In entrambi i casi 
     * 
     * Il componente deve avere nel suo handler una funzione con nome TableActionManagerType (es. componentRef.current.add() )
     * Il manager eseguirà la funzione suddetta
     */
    manager?: TableActionManager;

}

export type TableActionProps<T> = {
    data: T;
    componentRef?: React.RefObject<any>;
    closeFunc?: () => void;
}

export const TABLE_ACTION_MANAGER_NAME = {
    ADD: 'add',
    EDIT: 'edit',
    DELETE: 'delete',
    VIEW: 'view',
    EXPORT: 'export'
}

export type TableActionManager = typeof TABLE_ACTION_MANAGER_NAME[keyof typeof TABLE_ACTION_MANAGER_NAME];

export type TableTranslations = {
    title: string;
    subTitle: string;
    columns: { [key: string]: string; }
}


export type ColumnHandlerProps<T> = {
    item?: T;
    columns: { [colName: string]: TableColumnConfig; },
    actions?: { [actionName: string]: TableActionConfig<T>; },

    domain: string,
    title?: string;
    t: TableTranslations;
    gridApi: GridApi;
    actionHandlerRef:any; // actionHandlerRef

    hasAdminAuthorization?: () => boolean;
    
}