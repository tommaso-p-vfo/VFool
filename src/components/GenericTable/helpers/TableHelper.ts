//TODO - gestione PERMISSION HELPER system e protected columns

import { getTranslation } from "../../../utils/TranslationHelper";

import { AG_GRID_STORAGE_KEYS } from "../constants/tableStorageConstants";
import { getFromSession, getFromLocalSession, saveInSession, saveInLocalSession } from "../../../utils/StorageHelper";

import { buildPath } from '../../../utils/Path';
import { isEmptyObject } from '../../../utils/Guards';

import type { FilterModel } from "../../../types/api/FilterModel";


import type { CellClickedEvent, ColDef, ColumnState, GridApi, ITextFilterParams } from 'ag-grid-community';
import { AG_GRID_COLUMN_TYPE, AG_GRID_FILTER_TYPE, COL_EMPTY_PLACEHOLDER, COL_MIN_WIDTH, DEFAULT_COLUMN_FILTER, DEFAULT_COLUMN_SORTABLE, type AgGridColumnType, type AgGridFilterType } from "../constants/tableConstants";
//TODO fix ActionsCellRenderer
// import ActionsCellRenderer from "../components/actions/ActionCellRenderer";

import type { InternalTableColumnMetadata, TableColumnMetadata, TableMetadata } from "../types/TableMetadata";
import type { TableInternalMetadata } from "../types/TableInternalMetadata";
import ColorCellRenderer, { ColorHeader } from "../components/cell-renderers/ColorCellRenderer";

//TODO fix ActionsMetadata
// import type { ActionsMetadata } from "../components/actions/types/ActionsMetadata";

import BoxedTextCellRenderer from "../components/cell-renderers/BoxedTextCellRenderer";
import BoxedNumberCellRenderer from "../components/cell-renderers/BoxedNumberCellRenderer";
import HighlightedTextCellRenderer from "../components/cell-renderers/HighlightedTextCellRenderer";
import EmphasizedTextCellRenderer from "../components/cell-renderers/EmphasizedTextCellRenderer";
import CurrencyCellRenderer from "../components/cell-renderers/CurrencyCellRenderer";
import { BooleanFilter } from "../components/filters/BooleanFilter";
import CollapseWrapperCellRenderer from "../components/cell-renderers/CollapseWrapperCellRenderer";
import ProgressBarCellRenderer from "../components/cell-renderers/ProgressBarCellRenderer";
import CountabilityNumberCellRenderer from "../components/cell-renderers/CountabilityNumberCellRenderer";
import BoxedComboboxCellRenderer from "../components/cell-renderers/BoxedComboboxCellRenderer";
import CopyWrapperCellRenderer from "../components/cell-renderers/CopyWrapperCellRenderer";
import BooleanCellRenderer from "../components/cell-renderers/BooleanCellRenderer";
import ListCellRenderer from "../components/cell-renderers/ListCellRenderer";

import { type TableUserFilter } from "../types/TableCustomFilter";
import { TableCustomSetting } from "../types/TableCustomSettings";
import { ColumnHandlerProps, TableActionConfig, TableColumnConfig, TableTranslations } from "../types/TableAttributes";

// import { ArrayIncludesFilter } from "../components/filters/ArrayIncludesFilter";

export type ColumnDefProps<T> = { 
     colName: string;
     columns: { [colName: string]: TableColumnConfig; };
     t: TableTranslations;
     
     colWidth?: number;
     minWidth?: number;
     actions?: { [actionName: string]: TableActionConfig<T>; };

     hasAdminAuthorization?: () => boolean;
 }


export type CellRendererStrategyResponse = { cellRenderer: any, wrappedCellRenderer: any | undefined }

/**
 * Traduzioni delle tabelle, indicizzate per chiave di dominio.
 */
export type TranslationTableEntity = Record<
    string,
    {
        /** Nome della tabella visualizzato all'utente */
        tableName: string;
        /** Nome singolare dell'entità (es. "Gara") */
        entityName: string;
        /** Mappa nome campo → etichetta tradotta */
        columns: Record<string, string>;
    }
>;

export class TableHelper {

    /**
     * 
     * @param item - un oggetto che rappresenta una riga della tabella 
     * @param t - le traduzioni da utilizzare per i nomi delle colonne
     * @param metadata - metadata di configurazione della tabella configurabili in fase di definizione della GenericTable
     * @param internalMetadata - metadata di sistema integrativi utili per il rendering
     * 
     * @returns - un array di definizioni di colonne per Ag-Grid
     */
    static getAgGridColumnDefs = <T>(props: ColumnHandlerProps<T>): ColDef[] => {

        let headers = [];

        const item = props.item;
        const t = props.t;

        const hasAdminAuthorization = props.hasAdminAuthorization;

        const columns = props.columns;
        const actions = props.actions;
        // const title = props.title;
        //const gridApi = props.gridApi;

        if(item) {
            headers = Object.keys(item).map(colName => {
                return TableHelper._getAgGridColumnDef({
                    colName,
                    //colWidth?,
                    columns,
                    // actions,
                    t,
                    hasAdminAuthorization
                });
            });
        } else {
            let columnsFromLocale = getTranslation(t, 'columns') ?? {} as TableTranslations;
            headers = Object.keys(columnsFromLocale).map(colName => {
                return TableHelper._getAgGridColumnDef({
                    colName,
                    //colWidth?,
                    columns,
                    // actions,
                    t,
                    hasAdminAuthorization
                });
            });
        }

        if(props.actions) {
            headers.push(TableHelper._getAgGridColumnDef({
                    colName: '_actions',
                    //colWidth?,
                    columns,
                    // actions,
                    t,
                    hasAdminAuthorization
                }))
        }

        headers.push({
            field: '_genericSearch',
            headerName: 'genericSearch',
            minWidth: COL_MIN_WIDTH, // larghezza predefinita
            filter: true,
            filterParams: { debounceMs: 500 } as ITextFilterParams,
            flex: 1, // colonne con dimensione flessibile e proporzionale
            hide: true,
            sortable: DEFAULT_COLUMN_SORTABLE,
            width: 100
        });

        return headers.filter(h => h !== null) as ColDef[]; //rimuove eventuali null
    }

    /**
     * 
     * TODO refreshAgGridColumnDefs
     * 
     * permette di ricostruire le definizioni delle colonne a partire dallo stato attuale delle colonne
     * utile per applicare le preferenze utente (visibilità, ordine, larghezza)
     * 
     * Riapplica la colonna speciale _actions qualora non presente nei column state
     * 
     * @param columnStates - stato delle colonne corrente
     * @param defaultColumnDefs - utilizzata per riapplicare colonne di default (come _actions)
     * @param metadata - metadata di configurazione
     * @param internalMetadata  - metadata integrativi di sistema ( come gridApi, tableName già tradotta... )
     * @returns 
     */
    static refreshAgGridColumnDefs = (columnStates: ColumnState[], defaultColumnDefs: ColDef[], metadata: TableMetadata, internalMetadata: TableInternalMetadata): ColDef[] => {
        //dato un array di ColumnState (stato attuale delle colonne in ag-grid) e i metadata della tabella
        //ricostruisce le definizioni delle colonne (ColDef) per ag-grid, tenendo conto delle preferenze utente
        
        // let headers = [] as ColDef[];
        // let includesActionCol = false;
        // columnStates.forEach(col => {

        //     if(col.colId == '_actions')
        //         includesActionCol = true;

        //     let header = TableHelper._getAgGridColumnDef({col, metadata, internalMetadata);
        //     if(header) {
        //         //ripristino proprietà della colState della sessione
        //         header.hide = col.hide;
        //         header.width = col.width;
        //     }

        //     headers.push(header);
        // });

        // if (!includesActionCol) {
        //     //in alcuni casi di refresh le col state salvate in memoria contengono già la colonna _actions
        //     let actionColumn = defaultColumnDefs.filter(col => col.field == '_actions');
        //     if (actionColumn.length > 0)
        //         headers.push(actionColumn[0]);
        // }

        // return headers.filter(h => h !== null) as ColDef[]; //rimuove eventuali null
    }


    /**
     * Uso interno. 
     * Crea un oggetto column quando non impostato nei metadata.
     * utilizza il colId per ragionare sul tipo di dato
     * @param colId 
     * 
     * @returns TableColumnMetadata
     */
    static _tryGetColumnType = (colId: string) => {


        let typeInferred = false;

        let result = {
            success: false,
            column: {} as TableColumnMetadata
        }

        let column = {} as TableColumnMetadata;
        if (colId) {

            if (colId.endsWith('Date') ||
                colId.endsWith('At')) {
                typeInferred = true;
                column.type = AG_GRID_COLUMN_TYPE.AG_GRID_DATE;
                column.sortable = DEFAULT_COLUMN_SORTABLE;
            }
            else if (colId.startsWith('has') ||
                colId.startsWith('is') ||
                colId.startsWith('canBe') ||
                colId.startsWith('enable') ||
                colId.endsWith('Enabled') ) {
                typeInferred = true;
                column.type = AG_GRID_COLUMN_TYPE.BOOLEAN;
                column.sortable = DEFAULT_COLUMN_SORTABLE;
            }
            else if (colId.startsWith('total') ||
                colId.startsWith('active') ||
                colId.startsWith('completed') ||
                colId.endsWith('Count') ||
                colId.endsWith('Closed'))
            {
                typeInferred = true;
                column.type = AG_GRID_COLUMN_TYPE.BOXED_NUMBER;
                column.sortable = DEFAULT_COLUMN_SORTABLE;
            }
            else if (colId.endsWith('Color')) {
                typeInferred = true;
                column.type = AG_GRID_COLUMN_TYPE.COLOR;
                column.sortable = DEFAULT_COLUMN_SORTABLE;
            } 
            else if (colId.endsWith('Percentage')) {
                typeInferred = true;
                column.type = AG_GRID_COLUMN_TYPE.PROGRESS_BAR;
                column.sortable = DEFAULT_COLUMN_SORTABLE;
            }
            else if (
                colId.startsWith('id') ||
                colId.endsWith('Id')
            ) {
                typeInferred = true;
                column.type = AG_GRID_COLUMN_TYPE.AG_GRID_NUMBER;
                column.sortable = DEFAULT_COLUMN_SORTABLE;
            } else {
                //default
                typeInferred = true;
                column.type = AG_GRID_COLUMN_TYPE.AG_GRID_TEXT;
                column.sortable = DEFAULT_COLUMN_SORTABLE;
            }
        }

        if(typeInferred) {
            result.success = true;
            result.column = column;
        }

        return result;
    }

    /**
     * 
     * @param colId - nome della colonna - la stessa del DTO
     * @param metadata - TableMetadata

     * @returns il columnDef predefinito
     */
    private static _getAgGridColumnDef = <T>( {
        colName, 
        columns, 
        t, 
        colWidth, 
        minWidth, 
        actions, 
        hasAdminAuthorization 
    }: ColumnDefProps<T>) => {


        let colId = colName;
        let colDef = {} as ColDef;
        
        //se è definita almeno una colonna (eccetto _actions), nascondo tutte le colonne di default
        let globalHide = columns ? true : false;
    
        let isAdmin = hasAdminAuthorization ? hasAdminAuthorization() : false;
        let column = (columns?.[colId] ?? null) as TableColumnConfig;

        if(column?.systemColumn && !isAdmin) return null;

        let hide = column ? (column.hide || (column.protected && !isAdmin)) ?? false : globalHide;

        //basic settings
        colDef = {
            field: colId,
            headerName: t.columns?.[colId] ?? colId,
            width: colWidth ?? COL_MIN_WIDTH,
            minWidth: minWidth ?? COL_MIN_WIDTH, // larghezza predefinita
            flex: 1, // colonne con dimensione flessibile e proporzionale
            hide: hide   
        };

        if (!column) {
            //non settata nei metadata
            let result = TableHelper._tryGetColumnType(colId);
            if(result.success) {
                column = result.column;
            } else {
                //colonna default
                colDef.filter = DEFAULT_COLUMN_FILTER;
                colDef.sortable = DEFAULT_COLUMN_SORTABLE;
                return colDef;
            }
        }

        //general settings
        let colSortable = column?.sortable ?? DEFAULT_COLUMN_SORTABLE;
        
        colDef = {
            ...colDef,
            sortable: colSortable
        };

        //custom settings
        let customDefinitions = TableHelper.handleColunnType(colId, column);

        colDef = {
            ...colDef,
            ...customDefinitions
        };

        return colDef;
    }

    /**
     * Gestione reload dati e ripristino ordinamento colonne personalizzato - START
     */

    static refreshAgGrid = (gridApi: GridApi) => {
       // gridApi?.purgeInfiniteCache();
        gridApi?.refreshInfiniteCache();
    }


    static _getDomainForAgGrid = (domain?:string) => {
        //ad uso interno
        //rimuove le parti del dominio legate alla specializzazione della griglia
        //come il sottodominio ONLY_MINE_FILTER che è utile solo al service locator
        //ma non aggiunge dettaglio UX alla griglia
        //in questo modo posso mantenere una sola chiave in sessione per le columnPreferences (ad esempio)

        if(!domain) return;

        return domain;
    }

    /**
     * ricava le preferenze della sessione corrente delle colonne
     * 
     * @param domain il dominio della tabella (es. 'users', 'products', ecc.) - usato per costruire la chiave di storage
     * @returns le preferenze della sessione corrente delle colonne
     */
    static getCurrentColumnStates = (domain: string) => {

        let currentColumnStates = [] as ColumnState[];
        let columnPreferencesPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_PREFERENCES);

        let columnPref = getFromSession(columnPreferencesPath);
        if (!isEmptyObject(columnPref)) {
    
            let sessionColumnStates = columnPref.settings as ColumnState[] | null;
            if (sessionColumnStates != null && sessionColumnStates.length > 0) {
                //refresh del browser o get rows successivo
                //carico le preferenze temporanee salvate in sessione
                currentColumnStates = sessionColumnStates;
            }

        }

        return currentColumnStates;

    }

    static purgeColumnStates = (columnStates: ColumnState[], defaultColumnDefs: ColDef[]): ColumnState[] => {

        if(columnStates.length == 0) return columnStates;

        //rimuove dalle column state eventuali colonne che non sono più presenti nei default column def (ad esempio per colonne nuove aggiunte a db)
        let purgedColumnStates = columnStates.filter(state => defaultColumnDefs.some(def => def.field === state.colId));
        
        let newColumns = defaultColumnDefs.filter(def => !columnStates.some(state => state.colId === def.field)).map(def => { 
            return { colId: def.field, hide: def.hide ?? false, width: def.width ?? COL_MIN_WIDTH, pinned: def.pinned } as ColumnState;
        });

        return [...purgedColumnStates, ...newColumns] as ColumnState[];
    }

    /**
     * ricava le preferenze delle colonne salvate in sessione
     * 
     * @param domain il dominio della tabella (es. 'users', 'products', ecc.) - usato per costruire la chiave di storage
     * @returns le preferenze correnti delle colonne salvate in localStorage - empty altrimenti 
     */
    static getUserGridSettingsFromLocalSession = (domain: string): TableCustomSetting => {

        let columnPreferencesPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_PREFERENCES);

        let columnPref = getFromLocalSession(columnPreferencesPath);
        if (!isEmptyObject(columnPref)) {            
            return { ...columnPref };
        }

        return {} as TableCustomSetting;

    }

    /**
     * 
     * @param domain salva in sessionStorage (e in local se richiesto) le preferenze correnti delle colonne
     * @param columnStates 
     * @param saveInLocalStorage - salva anche in local - default false
     */
    static saveCurrentColumnStates = (domain: string, columnStates: ColumnState[], isInit: boolean = false): TableCustomSetting => {
        let columnPreferencesPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_PREFERENCES);
        //salvo in sessione
        let gridSettings = {} as TableCustomSetting;

        let columnPref = getFromLocalSession(columnPreferencesPath);
        if (!isEmptyObject(columnPref)) {
            
            gridSettings = {
                ...columnPref,
                settings: columnStates,
                _isModified: !isInit
            } as TableCustomSetting;
        } else {
            gridSettings = {
                id: -1,
                entityName: domain,
                settings: columnStates,
                _isModified: !isInit
            } as TableCustomSetting;
        }

        saveInSession(columnPreferencesPath, gridSettings);

        if (isInit) {
            saveInLocalSession(columnPreferencesPath, gridSettings);
        }

        return gridSettings;
    }

    /**
     * 
     * @param domain ricava dal sessionStorage le preferenze correnti della dimensione della tabella
     * @param pageSize 
     */
    static getCurrentTablePageSize = (domain: string, defaultPageSize: number) => {
        let pageSizePath = buildPath(domain, AG_GRID_STORAGE_KEYS.PAGESIZE_PREFERENCE);
        //ricavo dalla sessione
        let pageSize = sessionStorage.getItem(pageSizePath);
        if(pageSize)
            return Number(pageSize);

        return defaultPageSize;
    }

    /**
     * 
     * @param domain salva in sessionStorage le preferenze correnti della dimensione della tabella
     * @param pageSize 
     */
    static saveCurrentTablePageSize = (domain: string, pageSize: number) => {
        let pageSizePath = buildPath(domain, AG_GRID_STORAGE_KEYS.PAGESIZE_PREFERENCE);
        //salvo in sessione
        sessionStorage.setItem(pageSizePath, JSON.stringify(pageSize));
    }

    static getCurrentTablePage = (domain: string, defaultPageNumber: number) => {
        let pageNumberPath = buildPath(domain, AG_GRID_STORAGE_KEYS.CURRENT_PAGE);
        //ricavo dalla sessione
        let pageNumber = sessionStorage.getItem(pageNumberPath);
        if (pageNumber)
            return Number(pageNumber);

        return defaultPageNumber;
    }

    static resetCurrentTablePage = (domain: string) => {
        let pagePath = buildPath(domain, AG_GRID_STORAGE_KEYS.CURRENT_PAGE);
        sessionStorage.setItem(pagePath, JSON.stringify(0));
    }

    static saveCurrentTablePage = (domain: string, pageNumber: number) => {
        let pagePath = buildPath(domain, AG_GRID_STORAGE_KEYS.CURRENT_PAGE);
        sessionStorage.setItem(pagePath, JSON.stringify(pageNumber));
    }

    /**
     * ricava dal sessionStorage le preferenze correnti del filtro della tabella
     * @param domain 
     */
    static getCurrentTableFilter = (domain: string) => {
        let filterPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_FILTER_PREFERENCES);
        //ricavo dalla sessione
        let filter = sessionStorage.getItem(filterPath);
        if (filter)
            return JSON.parse(filter) as FilterModel;

        return {} as FilterModel;
    }

    /**
     * salva in sessionStorage le preferenze correnti del filtro della tabella
     * @param domain
     * @param id
     * @param name - opzionale - default 'default' 
     */
    static getCurrentTableFilterDetails = (domain: string) => {

        let filterPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_FILTER_DETAILS);

        let filter = sessionStorage.getItem(filterPath);
        if (filter)
            return JSON.parse(filter);

        return {};

    }

    /**
     * ricava dal sessionStorage le preferenze correnti del filtro della tabella
     * @param domain 
     */
    static getCurrentQuickTableFilter = (domain: string) => {
        let quickFilterPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_CURRENT_QUICK_FILTER);
        //ricavo dalla sessione
        let filter = sessionStorage.getItem(quickFilterPath);
        if (filter)
            return filter;

        return undefined;
    }

    /**
     * salva in sessionStorage le preferenze correnti del filtro della tabella
     * @param domain
     * @param filter 
     */
    static saveCurrentTableFilter = (domain: string, filter: any, quickSearchText?: string) => {

        let filterPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_FILTER_PREFERENCES);
        //salvo in sessione
        sessionStorage.setItem(filterPath, JSON.stringify(filter));

        let quickFilterPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_CURRENT_QUICK_FILTER);
        if (quickSearchText && quickSearchText !== '' &&  quickSearchText !== undefined) {
            sessionStorage.setItem(quickFilterPath, quickSearchText);
        }
    }

    /**
     * salva in sessionStorage le preferenze correnti del filtro della tabella
     * @param domain
     * @param id
     * @param name - opzionale - default 'default' 
     */
    static saveCurrentTableFilterDetails = (domain: string, filter?: TableUserFilter) => {

        let filterPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_FILTER_DETAILS);
        //salvo in sessione
        sessionStorage.setItem(filterPath, JSON.stringify({ ...filter, definition: undefined }));

    }

    /**
     * 
     * @param domain rimuove dal sessionStorage la selected row
     */
    static removeCurrentTableFilter = (domain: string) => {
        let filterPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_FILTER_PREFERENCES);
        //rimuovo dalla sessione
        sessionStorage.removeItem(filterPath);

        //pulizia dei dettagli del filtro
        let filterDetailsPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_FILTER_DETAILS);
        sessionStorage.removeItem(filterDetailsPath);
    }


    /**
     * 
     * @param domain rimuove dal sessionStorage la selected row
     */
    static removeCurrentQuickTableFilter = (domain: string) => {
        let selectedRowPath = buildPath(domain, AG_GRID_STORAGE_KEYS.COLUMN_CURRENT_QUICK_FILTER);
        //rimuovo dalla sessione
        sessionStorage.removeItem(selectedRowPath);
    }



    /**
 * 
 * @param domain ricava dal sessionStorage la riga selezionata(selected row)
 */
    static getSelectedRow = (domain: string) => {
        let selected = buildPath(domain, AG_GRID_STORAGE_KEYS.SELECTED_ROW);
        //ricavo dalla sessione
        let selectedRow = sessionStorage.getItem(selected);
        if (selectedRow)
            return selectedRow;

        return undefined;
    }

    /**
     * 
     * @param domain salva in sessionStorage la selected row
     * @param selectedRow 
     */
    static saveSelectedRow = (domain: string, selectedRow: number) => {
        let selectedRowPath = buildPath(domain, AG_GRID_STORAGE_KEYS.SELECTED_ROW);
        //salvo in sessione
        sessionStorage.setItem(selectedRowPath, selectedRow);
    }

    /**
     * 
     * @param domain rimuove dal sessionStorage la selected row
     */
    static removeSelectedRow = (domain: string) => {
        let selectedRowPath = buildPath(domain, AG_GRID_STORAGE_KEYS.SELECTED_ROW);
        //rimuovo dalla sessione
        sessionStorage.removeItem(selectedRowPath);
    }

    /**
     * Gestione reload dati e ripristino ordinamento colonne personalizzato - END
     */

    /**
     * 
     * @param column 
     * @param cellRenderer 
     * @returns 
     */
    static _getCellRendererStrategy = (column: TableColumnConfig, cellRenderer: any): CellRendererStrategyResponse => {
        if (column.collapsable)
            return { cellRenderer: CollapseWrapperCellRenderer, wrappedCellRenderer: cellRenderer };

        if(column.copyable)
            return { cellRenderer: CopyWrapperCellRenderer, wrappedCellRenderer: cellRenderer };

        return {cellRenderer, wrappedCellRenderer: undefined};
    }


    /***
     * Determina quale filtro e cell renderer applicare in base al tipo di colonna
     * 
     * @param domain - il dominio della tabella (es. CONFIGURATION.TENDER_TYPES)
     * @param column - le configurazioni della colonna specificate nei metadata
     * @param internalMetadata - dati interni e integrativi per la renderizzazione delle colonne
     * @param actionsEvents - quando impostati detarminano il comportamento della colonna actions, disattivando il comportamento di default
     * 
     * @returns la colDef integrata con le personalizzazioni in base al tipo di colonna
     */
    static handleColunnType = (
        colId: string,
        column: TableColumnConfig, 

        // internalMetadata?: TableInternalMetadata, 
        // tableMetadata?: TableMetadata
    
    ): ColDef => {

        let colDef = {} as ColDef;
        
        // let actionsEvents = tableMetadata?.events as TableEvents<any>;
        //let modalVersion = tableMetadata?.modalVersion;

        let cellRendererStrategyResponse = {} as CellRendererStrategyResponse;

        let type = column.type;  

        switch (type) {

            // case AG_GRID_COLUMN_TYPE.ACTIONS:

            //     let actionsMetadata = { 
            //         // domain: domain, //lo prende dal tableContext
            //         actionsConfig: column?.params?.actions, 
            //         tableName: internalMetadata?.tableName, 
            //         // events: actionsEvents, 
            //         //modalVersion: modalVersion 
                
            //     }; // as ActionsMetadata;

            //     colDef.field = "_actions";
            //     colDef.lockPosition = "right";
            //     colDef.pinned = "right";
            //     colDef.resizable = false;
            //     colDef.suppressSizeToFit = true; // evita che sizeColumnsToFit la comprima/allarghi
            //     // colDef.minWidth = 180;
            //     // colDef.width = 200;
            //     // colDef.maxWidth = 200;
            //     // colDef.width = 0;
            //     colDef.headerName = getTranslation(internalMetadata?.t, "configuration.actionsColumn.headerName") || "";
            //     colDef.headerClass = 'ag-center-header';
            //     colDef.sortable = false;
            //     //TODO fix ActionsCellRenderer
            //     // colDef.cellRenderer =  ActionsCellRenderer; // Aggiungi il cell renderer
            //     colDef.cellRendererParams = {
            //         // gridApi: internalMetadata?.gridApi,
            //         metadata: actionsMetadata
            //     };

            //     break;
            case AG_GRID_COLUMN_TYPE.COLOR:
                colDef.headerComponent = ColorHeader;
                colDef.headerComponentParams = {
                   //...metadata here
                }
                colDef.cellRenderer = ColorCellRenderer;
                colDef.cellRendererParams = {
                    colId: colId ?? 'color',
                    params: column.params
                };
                break;
            
            case AG_GRID_COLUMN_TYPE.BOXED_COMBOBOX:
                //colDef.headerComponent = ColorHeader;
                //colDef.headerComponentParams = {
                //    //...metadata here
                //}
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, BoxedComboboxCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let boxedComboColorColId = colId ?? 'boxedColor';
                if(boxedComboColorColId.includes('Name')){
                    boxedComboColorColId = boxedComboColorColId.substring(0, boxedComboColorColId.lastIndexOf('Name')).concat('Color');
                } else if (boxedComboColorColId.includes('Id')) {
                    boxedComboColorColId = boxedComboColorColId.substring(0, boxedComboColorColId.lastIndexOf('Id')).concat('Color');
                } else if(!(boxedComboColorColId.includes('Color') || boxedComboColorColId === 'color')) { 
                    boxedComboColorColId = '';
                } 

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: colId,
                    params: column.params,
                    boxedColorColId: boxedComboColorColId
                };
            break;
            
        case AG_GRID_COLUMN_TYPE.BOXED_TEXT:
                //colDef.headerComponent = ColorHeader;
                //colDef.headerComponentParams = {
                //    //...metadata here
                //}
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, BoxedTextCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let boxedColorColId = colId ?? 'boxedColor';
                if(boxedColorColId.includes('Name')){
                    boxedColorColId = boxedColorColId.substring(0, boxedColorColId.lastIndexOf('Name')).concat('Color');
                } else if (boxedColorColId.includes('Id')) {
                    boxedColorColId = boxedColorColId.substring(0, boxedColorColId.lastIndexOf('Id')).concat('Color');
                } else if(!(boxedColorColId.includes('Color') || boxedColorColId === 'color')) { 
                    boxedColorColId = '';
                } 

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: colId,
                    params: column.params,
                    boxedColorColId: boxedColorColId
                };
                break;
            case AG_GRID_COLUMN_TYPE.BOXED_NUMBER:
                colDef.headerClass = 'ag-center-header';
                colDef.cellClass = 'text-center';
                // colDef.headerComponent = BoxedNumberHeader;
                // colDef.headerComponentParams = {
                //    //...metadata here
                // }
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, BoxedNumberCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let counterColId = colId ?? 'counter';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: counterColId,
                    params: column.params
                };

                break;

            case AG_GRID_COLUMN_TYPE.HIGHLIGHTED_TEXT:
                //colDef.headerComponent = ColorHeader;
                //colDef.headerComponentParams = {
                //    //...metadata here
                //}
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, HighlightedTextCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let mainColId = colId ?? 'mainField';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: mainColId,
                    params: column.params
                };
                break;
            case AG_GRID_COLUMN_TYPE.EMPHASIZED_TEXT:
                //colDef.headerComponent = ColorHeader;
                //colDef.headerComponentParams = {
                //    //...metadata here
                //}
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, EmphasizedTextCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let empColId = colId ?? 'emphatizedField';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: empColId,
                    params: column.params
                };
                break;
            case AG_GRID_COLUMN_TYPE.CURRENCY_NUMBER:
                //colDef.headerComponent = ColorHeader;
                //colDef.headerComponentParams = {
                //    //...metadata here
                //}
                colDef.headerClass = 'ag-right-aligned-header'; 
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, CurrencyCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let currencyColId = colId ?? 'currency';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: currencyColId,
                    params: column.params
                };
                break;
            case AG_GRID_COLUMN_TYPE.COUNTABILITY_NUMBER:

                colDef.headerClass = 'ag-right-aligned-header';
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, CountabilityNumberCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let countabilityColId = colId ?? 'countability';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: countabilityColId,
                    params: column.params
                };
                break;

            case AG_GRID_COLUMN_TYPE.PROGRESS_BAR:
                colDef.headerClass = 'ag-center-header';
                colDef.cellClass = 'ag-grid-center-cell';
                // colDef.headerComponent = BoxedNumberHeader;
                // colDef.headerComponentParams = {
                //    //...metadata here
                // }
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, ProgressBarCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: colId,
                    params: column.params
                };
                break;

            case AG_GRID_COLUMN_TYPE.LIST:
                colDef.headerClass = 'ag-center-header';
                colDef.cellClass = 'text-center';
                // colDef.headerComponent = BoxedNumberHeader;
                // colDef.headerComponentParams = {
                //    //...metadata here
                // }
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, ListCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: colId,
                    params: column.params
                };

                break;

            case AG_GRID_COLUMN_TYPE.BOOLEAN:
                colDef.headerClass = 'ag-center-header';
                colDef.cellClass = 'text-center';
                colDef.cellRenderer = BooleanCellRenderer;
                colDef.cellRendererParams = {
                    colId: colId,
                    params: column.params
                };               
                break;

            case AG_GRID_COLUMN_TYPE.AG_GRID_DATE:
                colDef.headerClass = 'ag-center-header';
                colDef.cellClass = 'text-center';
                colDef.valueFormatter = (params) => {
                    if (!params.value) return COL_EMPTY_PLACEHOLDER;
                    const date = new Date(params.value);
                    return date.toLocaleDateString('it-IT'); // Formato italiano: DD/MM/YYYY
                }
                break;
            case AG_GRID_COLUMN_TYPE.AG_GRID_NUMBER:
                colDef.headerClass = 'ag-center-header';
                colDef.cellClass = 'text-center';
                break;
            default:
                colDef.valueFormatter = (params) => {
                    if (!params.value) return COL_EMPTY_PLACEHOLDER;
                    return params.value;
                }
                break;
        }

        //onClick setting - start
        // let actionConfig = column?.params?.actionConfig;
        // colDef.cellClass = (column.collapsable || actionConfig) ? ''.concat(colDef.cellClass).concat(' ').concat('cursor-pointer') : colDef.cellClass;
        // if (actionConfig) {
        //     let actionHandler = internalMetadata?.actionHandlerRef.current;
        //     colDef.onCellClicked = column.collapsable ? undefined : (event: CellClickedEvent) => {

        //         if(!actionConfig?.enabled) return;

        //         if (actionConfig) {
        //             let actionHandler = internalMetadata?.actionHandlerRef.current;
        //             actionConfig.gridApi = internalMetadata?.gridApi;
        //             actionHandler?.setActionConfig(actionConfig);
        //             actionHandler?.setData(event.data);
        //         }

        //         actionHandler?.handleAction();

        //     }
        // }
        //onClick setting - end

        TableHelper.applyFilterParams(colDef, column);
        return colDef;

    }

    static applyFilterParams = (colDef: ColDef, column: TableColumnConfig): any => {

        let type = column.type;
        let colFilter = column.filter ?? { enabled: DEFAULT_COLUMN_FILTER };
        let { enabled, ...filterParams } = colFilter;

        if (enabled == null || enabled == undefined)
            if (type != null && type != undefined && type != "")
                enabled = true;

        //standard config - start
        if (filterParams && !filterParams.buttons) {
            filterParams.buttons = ['reset', 'apply'];
        }

        if (filterParams && !filterParams.caseSensitive) {
            filterParams.caseSensitive = false;
        }
        //standard config - end 

        //ENABLE FILTER CONFIG - START
        switch (type) {
            //tipo custom - devono avere un filtro AG GRID impostato
            case AG_GRID_COLUMN_TYPE.ACTIONS:
                colDef.filter = false;
                break;
            case AG_GRID_COLUMN_TYPE.HIGHLIGHTED_TEXT:
            case AG_GRID_COLUMN_TYPE.EMPHASIZED_TEXT:
            case AG_GRID_COLUMN_TYPE.BOXED_TEXT:
            case AG_GRID_COLUMN_TYPE.COLOR:
                colDef.filter = enabled ? AG_GRID_COLUMN_TYPE.AG_GRID_TEXT : false;
                break;
            case AG_GRID_COLUMN_TYPE.BOXED_NUMBER:
            case AG_GRID_COLUMN_TYPE.CURRENCY_NUMBER:
                colDef.filter = enabled ? AG_GRID_COLUMN_TYPE.AG_GRID_NUMBER : false;
                break;
            //tipo di ag grid ufficiale
            case AG_GRID_COLUMN_TYPE.AG_GRID_TEXT:
            case AG_GRID_COLUMN_TYPE.AG_GRID_NUMBER:
            case AG_GRID_COLUMN_TYPE.AG_GRID_DATE:
                colDef.filter = enabled ? type : false;        
                break;
            case AG_GRID_COLUMN_TYPE.BOOLEAN:
                colDef.filter = enabled ? BooleanFilter : false;
                // I filtri custom non supportano floating filter
                colDef.floatingFilter = false;
                break;
                //TODO fix ArrayIncludesFilter
            // case AG_GRID_COLUMN_TYPE.LIST:
            //     colDef.filter = enabled ? ArrayIncludesFilter : false;
            //     // I filtri custom non supportano floating filter
            //     colDef.floatingFilter = false;

            //     colDef.filterParams = {
            //         ...colDef.filterParams,
            //         field: column.params?.field,
            //         domain: column.domain
            //     }

            //     break;
            default:
                colDef.filter = DEFAULT_COLUMN_FILTER;
                break;
        }
        //ENABLE FILTER CONFIG - END

        //FILTER CONFIG - START
        if(filterParams) {
            filterParams.filterOptions = TableHelper.getFilterOptions(type);
        }

        colDef.filterParams = { ...colDef.filterParams, ...filterParams};
        //FILTER CONFIG - END


        return colDef;

    }

    static getFilterOptions = (type: AgGridColumnType): AgGridFilterType[] => {

        let filterOptions = [] as AgGridFilterType[];

        switch (type) {
            case AG_GRID_COLUMN_TYPE.BOOLEAN:
            case AG_GRID_COLUMN_TYPE.LIST:
                //filter custom already applied here. vd. BooleanFilter.tsx
                break;
            // case AG_GRID_COLUMN_TYPE.LIST:
            //     if (type == AG_GRID_COLUMN_TYPE.LIST) {
            //         if (!filterOptions)
            //             filterOptions = [
            //                 AG_GRID_FILTER_TYPE.CONTAINS,
            //                 AG_GRID_FILTER_TYPE.NOT_CONTAINS
            //             ];
            //     }
            //     break;
            case AG_GRID_COLUMN_TYPE.AG_GRID_DATE:
                filterOptions = [
                    AG_GRID_FILTER_TYPE.EQUALS,
                    AG_GRID_FILTER_TYPE.IN_RANGE,
                    AG_GRID_FILTER_TYPE.LESS_THAN,
                    AG_GRID_FILTER_TYPE.GREATER_THAN,
                    AG_GRID_FILTER_TYPE.LESS_THAN_OR_EQUAL,
                    AG_GRID_FILTER_TYPE.GREATER_THAN_OR_EQUAL
                ];
                break;
            case AG_GRID_COLUMN_TYPE.CURRENCY_NUMBER:
            case AG_GRID_COLUMN_TYPE.AG_GRID_NUMBER:
            case AG_GRID_COLUMN_TYPE.BOXED_NUMBER:
                filterOptions = [
                    AG_GRID_FILTER_TYPE.EQUALS,
                    AG_GRID_FILTER_TYPE.IN_RANGE,
                    AG_GRID_FILTER_TYPE.LESS_THAN,
                    AG_GRID_FILTER_TYPE.GREATER_THAN,
                    AG_GRID_FILTER_TYPE.LESS_THAN_OR_EQUAL,
                    AG_GRID_FILTER_TYPE.GREATER_THAN_OR_EQUAL
                ];
                break;
            case AG_GRID_COLUMN_TYPE.AG_GRID_TEXT:
            case AG_GRID_COLUMN_TYPE.BOXED_TEXT:
            case AG_GRID_COLUMN_TYPE.HIGHLIGHTED_TEXT:
            case AG_GRID_COLUMN_TYPE.EMPHASIZED_TEXT:
            case AG_GRID_COLUMN_TYPE.BOXED_COMBOBOX:
                filterOptions = [
                    AG_GRID_FILTER_TYPE.CONTAINS,
                    AG_GRID_FILTER_TYPE.NOT_CONTAINS,
                    AG_GRID_FILTER_TYPE.EQUALS,
                    AG_GRID_FILTER_TYPE.NOT_EQUAL,
                    AG_GRID_FILTER_TYPE.BLANK,
                    AG_GRID_FILTER_TYPE.NOT_BLANK,
                ];
                break;
            default:
                break;
        }

        return filterOptions;
    } 



}