import type { ReactElement } from "react";
import type { PageRequest } from "../../../../types/dto/PageTypes";
import type { FilterModel } from "../../../../types/system/api/FilterModel";
import type { ActionsConfig } from "../components/actions/types/ActionsConfig";
import type { TableContextType } from "../contexts/TableContext";

/**
 * metadata pubblico da utilizzare per costruire nuove GenericTable
*/
export type TableMetadata<T> = {
    domain: string; // Service Domain - Identificatore univoco della tabella (vd. DOMAIN e SUBDOMAIN)
    defaultPageRequest?: PageRequest; // Richiesta di pagina predefinita per la tabella
    searchFilterColumns?: string[]; //nome colonne del filtro di ricerca testuale rapido - default 'name' se non impostato.
    hideTitle?: boolean; //se true, nasconde il titolo della tabella (utile se la tabella è inserita in un contesto che già ne prevede uno)
    // events?: TableEvents<T>, //eventi custom associati alla tabella
    modalVersion?: boolean; //se true usa i modal per i form di visualizzazione/modifica, altrimenti si aspetta un drawer custom
    columns?: {
        [colName: string]: TableColumnMetadata | undefined;
        _actions?: TableColumnActionMetadata<T>;
    },
    protectedColumns?: string[]; //elenco di nomi di colonne che non devono essere visualizzate in nessun modo dall'utente (a meno che non sia Admin).
    systemColumns?: string[]; //elenco di nomi di colonne che non devono essere visualizzate dall'utente ma devono essere raggiungibili dalla AG GRID (incluse in tabella) per ragioni di sistema
    maxBlocksInCache?: number; // Ag Grid - Numero massimo di blocchi nella cache per la tabella. Da usare per la gestione della memoria e delle performance.
    formContainer?: any; //DOM element dove iniettare i form di visualizzazione/modifica - default GenericModal
    preFilter?: FilterModel; //carica la griglia prefiltrata con il seguente filterModel - si applica al campo di 'ricerca rapida' Quick Search
    customTitle?: string, //da un nome alla tabella custom, a prescindere dal menu item
    gridDetails?: GridDetails, //aggiunge una card alla griglia per dettagliare la vista. es. un filtro per trattativa con i dettagli della trattativa
    actionBarConfig: ActionBarConfig; //permett di aggiungere azioni custom alla action bar (di fianco ad ADD e Gestione Colonne)
    contextDataConfig: ContextDataConfig[]; //aggiunge dati serverside al contesto della tabella
    
    summary?: { //sommario - totali restituiti dalle GET LIST lato server
        excludes?: string[]; //lista di proprietà del summary da non visualizzare nella generic table
    }
}

export type GridDetails = {
    title?: string;
    content: string; //trattato come HTML
}

export type TableColumnMetadata = {
    type: string; //AG_GRID_TYPE_COLUMN constant
    filter?: { //personalizzazione filtro adv a livello di singola colonna
        enabled?: boolean; //permette di disattivare il filtro esplicitamente
        [filterField: string]: any;
    },
    domain?: string; //alcuni tipi colonna (es. COMBOBOX) potrebbero richiedere la fetch di dati dal server tramite dominio
    hide?: boolean, //visualizza o meno la colonna in tabella - default false
    sortable?: boolean //permette o meno l'ordinamento sulla colonna - default true
    collapsable?: boolean, //rende la colonna collassabile - apre un container al click per la visualizzazione completa - mutualmente esclusivo con copyable
    copyable?: boolean, //rende la cella copiabile negli appunti - mutualmente esclusivo con collapsable
    params?: TableColumnParams; //parametri opzionali da passare alla colonna
    minWidth?: number; //dimensione colonna minima (inizializzazione)
}

export type TableColumnActionMetadata<T = any> = Omit<TableColumnMetadata, 'params'> & {
    params: { actions: ActionsConfig<T> }
}


export type InternalTableColumnMetadata = TableColumnMetadata & {
   colId: string;
   colName: string;
}

export type TableColumnParams = {
    defaultColor?: string; //IdsColor
    className?: string;
    actionConfig?: ActionsConfig;

    [key: string]: any;
}

export type ActionBarConfig = {
    actions?: ActionBarAction[]; //azioni custom
}

export type ActionBarAction = {
    id: string; //id univoco per tabella (dominio) - obbligatorio
    type: 'button' | 'switch';
    title: string;
    defaultValue?: any;
    onClick: (data: any, gridApi: any, tableContext: TableContextType) => void;
    icon: any;
    color: string; //IdsColor
    disabled?: boolean;
}

export type ContextDataConfig = {
    name: string;
    service: string;
    params: any;
}