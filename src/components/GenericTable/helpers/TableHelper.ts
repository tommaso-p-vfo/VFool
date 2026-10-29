import { TranslationHelper } from "../../../../locales/helpers/TranslationHelper";

import type { CellClickedEvent, ColDef, ColumnState, GridApi, ITextFilterParams } from 'ag-grid-community';
import { AG_GRID_COLUMN_TYPE, AG_GRID_FILTER_TYPE, COL_EMPTY_PLACEHOLDER, COL_MIN_WIDTH, DEFAULT_COLUMN_FILTER, DEFAULT_COLUMN_SORTABLE, type AgGridColumnType, type AgGridFilterType } from "../constants/agGridConstants";
import ActionsCellRenderer from "../components/actions/ActionCellRenderer";
import { PermissionHelper } from "../../../../core/auth/helpers/PermissionHelper";
import type { InternalTableColumnMetadata, TableColumnMetadata, TableMetadata } from "../types/TableMetadata";
import STORAGE from "../../../../storage/constants/storage";
import { AppPathHelper } from "../../../../core/helpers/AppPathHelper";
import type { TableInternalMetadata } from "../types/TableInternalMetadata";
import ColorCellRenderer, { ColorHeader } from "../components/cell-renderers/ColorCellRenderer";
import type { ActionsMetadata } from "../components/actions/types/ActionsMetadata";
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
import type { FilterModel } from "../../../../types/system/api/FilterModel";
import { SUBDOMAIN } from "../../../../core/constants/domains";
import BooleanCellRenderer from "../components/cell-renderers/BooleanCellRenderer";
import ListCellRenderer from "../components/cell-renderers/ListCellRenderer";
import type { UserCustomFilter } from "../../../../types/dto/UserCustomFilter";
import type { UserGridSetting } from "../../../../types/dto/UserGridSetting";
import { StorageHelper } from "../../../../storage/helpers/StorageHelper";
import { AppHelper } from "../../../../core/helpers/AppHelper";
import { ArrayIncludesFilter } from "../components/filters/ArrayIncludesFilter";

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
    static getAgGridColumnDefs = (item: any, metadata: TableMetadata, internalMetadata: TableInternalMetadata): ColDef[] => {

        let headers = [];

        if(item) {
            headers = Object.keys(item).map(colId => {
                return TableHelper._getAgGridColumnDef({ colId: colId } as ColumnState, metadata, internalMetadata);
            });
        } else {
            let columnsFromLocale = TranslationHelper.getProperty(internalMetadata.t, AppPathHelper.build(internalMetadata?.agGridDomain, 'columns'));
            headers = Object.keys(columnsFromLocale).map(colId => {
                return TableHelper._getAgGridColumnDef({ colId: colId } as ColumnState, metadata, internalMetadata);
            });
        }

        if(metadata?.columns?._actions) {
            headers.push(TableHelper._getAgGridColumnDef({ colId: '_actions' } as ColumnState, metadata, internalMetadata));
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
        
        let headers = [] as ColDef[];
        let includesActionCol = false;
        columnStates.forEach(col => {

            if(col.colId == '_actions')
                includesActionCol = true;

            let header = TableHelper._getAgGridColumnDef(col, metadata, internalMetadata);
            if(header) {
                //ripristino proprietà della colState della sessione
                header.hide = col.hide;
                header.width = col.width;
            }

            headers.push(header);
        });

        if (!includesActionCol) {
            //in alcuni casi di refresh le col state salvate in memoria contengono già la colonna _actions
            let actionColumn = defaultColumnDefs.filter(col => col.field == '_actions');
            if (actionColumn.length > 0)
                headers.push(actionColumn[0]);
        }

        return headers.filter(h => h !== null) as ColDef[]; //rimuove eventuali null
    }


    /**
     * Uso interno. 
     * Crea un oggetto column quando non impostato nei metadata.
     * utilizza il colId per ragionare sul tipo di dato
     * @param colId 
     * 
     * @returns TableColumnMetadata
     */
    static _getColumnType = (colId: string) => {


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
    private static _getAgGridColumnDef = (col: ColumnState, metadata: TableMetadata, internalMetadata: TableInternalMetadata) => {


        let colId = col.colId;

        // START - protectedColumns VS systemColumns
        /**
         * protectedColumns VS systemColumns
         * 
         * le colonne protette non sono caricate in AG GRID, non sono visibili in alcun modo dall'utente e non sono nemmeno fruibili dal sistema
         * le colonne di sistema sono caricate in AG GRID, vengono nascoste all'utente e sono raggiungibili dal sistema.
         * 
         * le colonne protette sono sempre visibili per gli utenti con role amministratore 
         */
        const protectedColumns = metadata?.protectedColumns ?? [];
        // const systemColumns = metadata?.systemColumns ?? [];
        // if (!systemColumns.includes(colId) && protectedColumns.includes(colId) && !PermissionHelper.isAdmin(internalMetadata?.user)){
        //     return null; //salta le colonne protette
        // }
        // END - protectedColumns VS systemColumns

        let colDef = {} as ColDef;
        
        let column = (metadata?.columns?.[colId] ?? null) as InternalTableColumnMetadata;

        //se è definita almeno una colonna (eccetto _actions), nascondo tutte le colonne di default
        let globalHide = metadata?.columns ? true : false;
        if (metadata?.columns && Object.keys(metadata?.columns).length == 1) {
            //gestione globalHide per _actions
            if (metadata?.columns._actions)
                globalHide = false;
        }
        let hide = column ? column.hide ?? false : globalHide;

        const translationColumnsPath = internalMetadata?.agGridDomain + '.columns';
        const columnNames = TranslationHelper.getProperty(internalMetadata.t, translationColumnsPath);

        //determina la visibilità della colonna a prescindere da filtri e scelta utente
        let colHide = systemColumns.includes(colId) ? true : PermissionHelper.isAdmin(internalMetadata?.user) ? false : (protectedColumns.includes(colId) || hide);

        //basic settings
        colDef = {
            field: colId,
            headerName: columnNames?.[colId] ?? colId,
            width: col.width ?? COL_MIN_WIDTH,
            minWidth: column?.minWidth ?? COL_MIN_WIDTH, // larghezza predefinita
            flex: 1, // colonne con dimensione flessibile e proporzionale
            hide: colHide
        };

        if (!column) {
            //non settata nei metadata
            let result = TableHelper._getColumnType(colId);
            if(result.success) {
                column = result.column;
            } else {
                //colonna default
                colDef.filter = DEFAULT_COLUMN_FILTER;
                colDef.sortable = DEFAULT_COLUMN_SORTABLE;
                return colDef;
            }
        }

        //passaggio del colId
        //per uso interno in handleColunnType
        column.colId = colId;
        column.colName = columnNames?.[colId] ?? colId;

        //general settings
        let colSortable = column?.sortable ?? DEFAULT_COLUMN_SORTABLE;
        
        colDef = {
            ...colDef,
            sortable: colSortable
        };

        //custom settings
        let customDefinitions = TableHelper.handleColunnType(internalMetadata?.agGridDomain, column, internalMetadata, metadata);

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

        const _path = domain
            ?.split('.')
            .filter(segment => segment !== SUBDOMAIN.ONLY_MINE_FILTER)
            .join('.');

        return _path;
    }

    /**
     * ricava le preferenze della sessione corrente delle colonne
     * 
     * @param domain il dominio della tabella (es. 'users', 'products', ecc.) - usato per costruire la chiave di storage
     * @returns le preferenze della sessione corrente delle colonne
     */
    static getCurrentColumnStates = (domain: string) => {

        let currentColumnStates = [] as ColumnState[];
        let columnPreferencesPath = AppPathHelper.build(domain, STORAGE.COLUMN_PREFERENCES);

        let columnPref = StorageHelper.getFromSession(columnPreferencesPath);
        if (!AppHelper.isEmptyObject(columnPref)) {
    
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
    static getUserGridSettingsFromLocalSession = (domain: string): UserGridSetting => {

        let columnPreferencesPath = AppPathHelper.build(domain, STORAGE.COLUMN_PREFERENCES);

        let columnPref = StorageHelper.getFromLocalSession(columnPreferencesPath);
        if (!AppHelper.isEmptyObject(columnPref)) {            
            return { ...columnPref };
        }

        return {} as UserGridSetting;

    }

    /**
     * 
     * @param domain salva in sessionStorage (e in local se richiesto) le preferenze correnti delle colonne
     * @param columnStates 
     * @param saveInLocalStorage - salva anche in local - default false
     */
    static saveCurrentColumnStates = (domain: string, columnStates: ColumnState[], isInit: boolean = false ): UserGridSetting => {
        let columnPreferencesPath = AppPathHelper.build(domain, STORAGE.COLUMN_PREFERENCES);
        //salvo in sessione
        let gridSettings = {} as UserGridSetting;

        let columnPref = StorageHelper.getFromLocalSession(columnPreferencesPath);
        if (!AppHelper.isEmptyObject(columnPref)) {
            
            gridSettings = {
                ...columnPref,
                settings: columnStates,
                _isModified: !isInit
            } as UserGridSetting;
        } else {
            gridSettings = {
                id: -1,
                entityName: domain,
                settings: columnStates,
                _isModified: !isInit
            } as UserGridSetting;
        }

        StorageHelper.saveInSession(columnPreferencesPath, gridSettings);

        if (isInit) {
            StorageHelper.saveInLocalSession(columnPreferencesPath, gridSettings);
        }

        return gridSettings;
    }

    /**
     * 
     * @param domain ricava dal sessionStorage le preferenze correnti della dimensione della tabella
     * @param pageSize 
     */
    static getCurrentTablePageSize = (domain: string, defaultPageSize: number) => {
        let pageSizePath = AppPathHelper.build(domain, STORAGE.PAGESIZE_PREFERENCE);
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
        let pageSizePath = AppPathHelper.build(domain, STORAGE.PAGESIZE_PREFERENCE);
        //salvo in sessione
        sessionStorage.setItem(pageSizePath, JSON.stringify(pageSize));
    }

    static getCurrentTablePage = (domain: string, defaultPageNumber: number) => {
        let pageNumberPath = AppPathHelper.build(domain, STORAGE.CURRENT_PAGE);
        //ricavo dalla sessione
        let pageNumber = sessionStorage.getItem(pageNumberPath);
        if (pageNumber)
            return Number(pageNumber);

        return defaultPageNumber;
    }

    static resetCurrentTablePage = (domain: string) => {
        let pagePath = AppPathHelper.build(domain, STORAGE.CURRENT_PAGE);
        sessionStorage.setItem(pagePath, JSON.stringify(0));
    }

    static saveCurrentTablePage = (domain: string, pageNumber: number) => {
        let pagePath = AppPathHelper.build(domain, STORAGE.CURRENT_PAGE);
        sessionStorage.setItem(pagePath, JSON.stringify(pageNumber));
    }

    /**
     * ricava dal sessionStorage le preferenze correnti del filtro della tabella
     * @param domain 
     */
    static getCurrentTableFilter = (domain: string) => {
        let filterPath = AppPathHelper.build(domain, STORAGE.COLUMN_FILTER_PREFERENCES);
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

        let filterPath = AppPathHelper.build(domain, STORAGE.COLUMN_FILTER_DETAILS);

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
        let quickFilterPath = AppPathHelper.build(domain, STORAGE.COLUMN_CURRENT_QUICK_FILTER);
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

        let filterPath = AppPathHelper.build(domain, STORAGE.COLUMN_FILTER_PREFERENCES);
        //salvo in sessione
        sessionStorage.setItem(filterPath, JSON.stringify(filter));

        let quickFilterPath = AppPathHelper.build(domain, STORAGE.COLUMN_CURRENT_QUICK_FILTER);
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
    static saveCurrentTableFilterDetails = (domain: string, filter?: UserCustomFilter) => {

        let filterPath = AppPathHelper.build(domain, STORAGE.COLUMN_FILTER_DETAILS);
        //salvo in sessione
        sessionStorage.setItem(filterPath, JSON.stringify({ ...filter, definition: undefined }));

    }

    /**
     * 
     * @param domain rimuove dal sessionStorage la selected row
     */
    static removeCurrentTableFilter = (domain: string) => {
        let filterPath = AppPathHelper.build(domain, STORAGE.COLUMN_FILTER_PREFERENCES);
        //rimuovo dalla sessione
        sessionStorage.removeItem(filterPath);

        //pulizia dei dettagli del filtro
        let filterDetailsPath = AppPathHelper.build(domain, STORAGE.COLUMN_FILTER_DETAILS);
        sessionStorage.removeItem(filterDetailsPath);
    }


    /**
     * 
     * @param domain rimuove dal sessionStorage la selected row
     */
    static removeCurrentQuickTableFilter = (domain: string) => {
        let selectedRowPath = AppPathHelper.build(domain, STORAGE.COLUMN_CURRENT_QUICK_FILTER);
        //rimuovo dalla sessione
        sessionStorage.removeItem(selectedRowPath);
    }



    /**
 * 
 * @param domain ricava dal sessionStorage la riga selezionata(selected row)
 */
    static getSelectedRow = (domain: string) => {
        let selected = AppPathHelper.build(domain, STORAGE.SELECTED_ROW);
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
        let selectedRowPath = AppPathHelper.build(domain, STORAGE.SELECTED_ROW);
        //salvo in sessione
        sessionStorage.setItem(selectedRowPath, selectedRow);
    }

    /**
     * 
     * @param domain rimuove dal sessionStorage la selected row
     */
    static removeSelectedRow = (domain: string) => {
        let selectedRowPath = AppPathHelper.build(domain, STORAGE.SELECTED_ROW);
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
    static _getCellRendererStrategy = (column: InternalTableColumnMetadata, cellRenderer: any): CellRendererStrategyResponse => {
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
    static handleColunnType = (domain: string, column: InternalTableColumnMetadata, internalMetadata?: TableInternalMetadata, tableMetadata?: TableMetadata): ColDef => {

        let colDef = {} as ColDef;
        
        // let actionsEvents = tableMetadata?.events as TableEvents<any>;
        //let modalVersion = tableMetadata?.modalVersion;

        let cellRendererStrategyResponse = {} as CellRendererStrategyResponse;

        let type = column.type;  

        switch (type) {

            case AG_GRID_COLUMN_TYPE.ACTIONS:

                let actionsMetadata = { 
                    domain: domain, 
                    actionsConfig: column?.params?.actions, 
                    tableName: internalMetadata?.tableName, 
                    // events: actionsEvents, 
                    //modalVersion: modalVersion 
                
                } as ActionsMetadata;

                colDef.field = "_actions";
                colDef.lockPosition = "right";
                colDef.pinned = "right";
                colDef.resizable = false;
                colDef.suppressSizeToFit = true; // evita che sizeColumnsToFit la comprima/allarghi
                // colDef.minWidth = 180;
                // colDef.width = 200;
                // colDef.maxWidth = 200;
                // colDef.width = 0;
                colDef.headerName = TranslationHelper.getProperty(internalMetadata?.t, "configuration.actionsColumn.headerName") || "";
                colDef.headerClass = 'ag-center-header';
                colDef.sortable = false;
                colDef.cellRenderer = ActionsCellRenderer; // Aggiungi il cell renderer
                colDef.cellRendererParams = {
                    // gridApi: internalMetadata?.gridApi,
                    metadata: actionsMetadata
                };

                break;
            case AG_GRID_COLUMN_TYPE.COLOR:
                colDef.headerComponent = ColorHeader;
                colDef.headerComponentParams = {
                   //...metadata here
                }
                colDef.cellRenderer = ColorCellRenderer;
                colDef.cellRendererParams = {
                    field: column.colId ?? 'color' //colId aggiunto per uso interno
                };
                break;
            
            case AG_GRID_COLUMN_TYPE.BOXED_COMBOBOX:
                //colDef.headerComponent = ColorHeader;
                //colDef.headerComponentParams = {
                //    //...metadata here
                //}
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, BoxedComboboxCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let boxedComboColorColId = column.colId ?? 'boxedColor';
                if(boxedComboColorColId.includes('Name')){
                    boxedComboColorColId = boxedComboColorColId.substring(0, boxedComboColorColId.lastIndexOf('Name')).concat('Color');
                } else if (boxedComboColorColId.includes('Id')) {
                    boxedComboColorColId = boxedComboColorColId.substring(0, boxedComboColorColId.lastIndexOf('Id')).concat('Color');
                } else if(!(boxedComboColorColId.includes('Color') || boxedComboColorColId === 'color')) { 
                    boxedComboColorColId = '';
                } 

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: column.colId,
                    colName: column.colName,
                    boxedColorColId: boxedComboColorColId,
                    defaultColor: column.params?.defaultColor
                };
            break;
            
        case AG_GRID_COLUMN_TYPE.BOXED_TEXT:
                //colDef.headerComponent = ColorHeader;
                //colDef.headerComponentParams = {
                //    //...metadata here
                //}
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, BoxedTextCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let boxedColorColId = column.colId ?? 'boxedColor';
                if(boxedColorColId.includes('Name')){
                    boxedColorColId = boxedColorColId.substring(0, boxedColorColId.lastIndexOf('Name')).concat('Color');
                } else if (boxedColorColId.includes('Id')) {
                    boxedColorColId = boxedColorColId.substring(0, boxedColorColId.lastIndexOf('Id')).concat('Color');
                } else if(!(boxedColorColId.includes('Color') || boxedColorColId === 'color')) { 
                    boxedColorColId = '';
                } 

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: column.colId,
                    colName: column.colName,
                    boxedColorColId: boxedColorColId,
                    defaultColor: column.params?.defaultColor
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

                let counterColId = column.colId ?? 'counter';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: counterColId,
                    colName: column.colName,
                    defaultColor: column.params?.defaultColor
                };

                break;

            case AG_GRID_COLUMN_TYPE.HIGHLIGHTED_TEXT:
                //colDef.headerComponent = ColorHeader;
                //colDef.headerComponentParams = {
                //    //...metadata here
                //}
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, HighlightedTextCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let mainColId = column.colId ?? 'mainField';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: mainColId,
                    colName: column.colName,
                    defaultColor: column.params?.defaultColor,
                    className: column.params?.className
                };
                break;
            case AG_GRID_COLUMN_TYPE.EMPHASIZED_TEXT:
                //colDef.headerComponent = ColorHeader;
                //colDef.headerComponentParams = {
                //    //...metadata here
                //}
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, EmphasizedTextCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let empColId = column.colId ?? 'emphatizedField';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: empColId,
                    colName: column.colName,
                    defaultColor: column.params?.defaultColor,
                    className: column.params?.className
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

                let currencyColId = column.colId ?? 'currency';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: currencyColId,
                    colName: column.colName,
                    defaultColor: column.params?.defaultColor,
                    defaultCurrency: column.params?.defaultCurrency
                };
                break;
            case AG_GRID_COLUMN_TYPE.COUNTABILITY_NUMBER:

                colDef.headerClass = 'ag-right-aligned-header';
                cellRendererStrategyResponse = TableHelper._getCellRendererStrategy(column, CountabilityNumberCellRenderer);
                colDef.cellRenderer = cellRendererStrategyResponse.cellRenderer;

                let countabilityColId = column.colId ?? 'countability';

                colDef.cellRendererParams = {
                    cellRenderer: cellRendererStrategyResponse.wrappedCellRenderer,
                    colId: countabilityColId,
                    colName: column.colName,
                    defaultColor: column.params?.defaultColor,
                    defaultSymbol: column.params?.defaultSymbol
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
                    colId: column.colId,
                    colName: column.colName,
                    defaultColor: column.params?.defaultColor
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
                    colId: column.colId,
                    field: column.params?.field,
                    defaultColor: column.params?.defaultColor
                };

                break;

            case AG_GRID_COLUMN_TYPE.BOOLEAN:
                colDef.headerClass = 'ag-center-header';
                colDef.cellClass = 'text-center';
                // let t = internalMetadata?.t as ITranslations;            
                // colDef.cellRenderer = (params: any) => params.value ? t.common.buttons.yes : params.value != undefined ? t.common.buttons.no : undefined;
                colDef.cellRenderer = BooleanCellRenderer;                
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
        let actionConfig = column?.params?.actionConfig;
        colDef.cellClass = (column.collapsable || actionConfig) ? ''.concat(colDef.cellClass).concat(' ').concat('cursor-pointer') : colDef.cellClass;
        if (actionConfig) {
            let actionHandler = internalMetadata?.actionHandlerRef.current;
            colDef.onCellClicked = column.collapsable ? undefined : (event: CellClickedEvent) => {

                if(!actionConfig?.enabled) return;

                if (actionConfig) {
                    let actionHandler = internalMetadata?.actionHandlerRef.current;
                    actionConfig.gridApi = internalMetadata?.gridApi;
                    actionHandler?.setActionConfig(actionConfig);
                    actionHandler?.setData(event.data);
                }

                actionHandler?.handleAction();

            }
        }
        //onClick setting - end

        TableHelper.applyFilterParams(colDef, column);
        return colDef;

    }

    static applyFilterParams = (colDef: ColDef, column: InternalTableColumnMetadata): any => {

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
            case AG_GRID_COLUMN_TYPE.LIST:
                colDef.filter = enabled ? ArrayIncludesFilter : false;
                // I filtri custom non supportano floating filter
                colDef.floatingFilter = false;

                colDef.filterParams = {
                    ...colDef.filterParams,
                    field: column.params?.field,
                    domain: column.domain
                }

                break;
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