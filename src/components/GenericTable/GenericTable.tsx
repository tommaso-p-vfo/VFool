import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
// import useTranslations from "../../../locales/hooks/useTranslations";
import { TableHelper } from "./helpers/TableHelper";

//Ag grid
import { AgGridReact } from "ag-grid-react";
import { AG_GRID_LOCALE_IT } from '@ag-grid-community/locale';

import type {
    ColDef,
    ColumnMovedEvent,
    ColumnResizedEvent,
    ColumnVisibleEvent,
    FilterChangedEvent,
    FilterModel,
    FirstDataRenderedEvent,
    GetRowIdParams,
    GridApi,
    GridReadyEvent,
    GridState,
    IDatasource,
    ModelUpdatedEvent,
    PaginationChangedEvent,
    SelectionChangedEvent,
} from "ag-grid-community";
import {
    InfiniteRowModelModule,
    ModuleRegistry,
    AllCommunityModule, 
    ValidationModule,
    NumberFilterModule,
    PaginationModule,
} from "ag-grid-community";

import type { PageRequest, PageResponse } from "../../types/api/PageTypes";
import { DataFormat } from "../../types/DataFormat";

import { SERVICE_ENDPOINT } from "../../constants/apiConstants";

import LoadingOverlay from "./components/LoadingOverlay";
import TableTopBar from "./components/table-top-bar/TableTopBar";

import type { TableAttributes } from "./types/TableAttributes";
import { type TableCustomFilter } from "./types/TableCustomFilter";

import type { ColumnState } from "./types/TableColumn";

// import { useSelector } from "react-redux";
// import type { User } from "../../../types/dto/User";


import { buildPath } from "../../utils/Path";
import { getFromSession } from "../../utils/StorageHelper";
import { getTranslation } from "../../utils/TranslationHelper";
import { isEmptyObject } from "../../utils/Guards";
import { formatAs } from "../../utils/Format";

import { AG_GRID_STORAGE_KEYS } from "./constants/storageConstants";
import { 
    AG_GRID_DEFAULT_PAGE_SIZE, 
    AG_GRID_PAGE_SIZE_SELECTOR, 
    AG_GRID_ROW_BLOCK_SIZE 
} from "./constants/agGridConstants";

import { type ApiRequest } from "../../types/api/ApiRequest";




import TableProvider, { type AgGridDomainType } from "./contexts/TableContext";
import type { TableInternalMetadata } from "./types/TableInternalMetadata";
import type { QuickFilterMetadata } from "./components/quick-filter/types/QuickFilterMetadata";
import type { ActionsMetadata } from "./components/actions/types/ActionsMetadata";
import type { TableTopBarMetadata } from "./components/table-top-bar/types/TableTopBarMetadata";
import { Card, CardBody, Container } from "react-bootstrap";
import type { GridDetails } from "./types/TableMetadata";
import GenericActionHandler from "./components/actions/GenericActionHandler";
import ColumnChooserModal from "./components/column-preferences/ColumnChoserModal";
import { useTableContext } from "./hooks/useTableContext";



import { UiHelper } from "../../../core/helpers/UiHelper";
import { type MenuItem } from "../../../types/system/MenuItem";
import { IdsColor } from "../../../types/system/IdsColor";
import type { UserGridSetting } from "../../../types/dto/UserGridSetting";



//ag grid - modulo community per caricamento dinamico dei dati
ModuleRegistry.registerModules([
    AllCommunityModule,
    NumberFilterModule,
    PaginationModule,
    InfiniteRowModelModule]);

if (process.env.NODE_ENV !== 'production') {
    //validazione ag grid solo per lo sviluppo
    ModuleRegistry.registerModules([ValidationModule]);
}

export const GenericTable =

    <T extends Record<string, any>>({ serviceLocator, metadata, ref }: TableAttributes<T> & { ref?: React.Ref<GridApi> }) => {

        useImperativeHandle(ref, () => ({
            gridApi: () => gridApiRef.current
        }));

        const t = useTranslations();
        const user = useSelector((state) => state?.user?.data) ?? {} as User;

        //DOMAIN
        const [domain, setDomain] = useState<AgGridDomainType>();
        const agGridDomainRef = useRef<string>('');
        const serviceLocatorDomainRef = useRef<string>(null);
        
        // PAGE SIZE - Inizializzazione sincrona — legge da storage al momento della dichiarazione
        const pageRestoredRef = useRef<boolean>(false);
        const [pageSelectorSize, setPageSelectorSize] = useState<number>();
        
        // PRE FILTER - filtro impostato tramite metadata
        const preFilterRef = useRef<FilterModel | null>(null);       
        
        //ACTIVE FILTER - filtro avanzato utente preso dalla sessione
        const [activeFilter, setActiveFilter] = useState<TableCustomFilter>();

        //PREFERENZE COLONNA CORRENTI
        const [gridSettings, setGridSettings] = useState<UserGridSetting>();

        //SOMMARIO - totali tabella ecc.
        const [summary, setSummary] = useState<any|undefined>(undefined);
        
        //COLUMN DEFS
        const [columnDefs, setColumnDefs] = useState<ColDef[]>([]);
        
        //TOP BAR
        const actionHandlerRef = useRef<any>(null);
        const [topBarMetadata, setTopBarMetadata] = useState({} as TableTopBarMetadata); //set in useEffects
        const topBarRef = useRef(null);
        const [openColumnChoser, setOpenColumnChoser] = useState(false);
        const [columnChooserProps, setColumnChooserProps] = useState({} as ColumnChooserModalProps); //set in useEffects
        
        //AG GRID
        const gridContext = useRef({ fromButtons: false /** fromButtons - necessario per indicare una interazione utente (click bottone) attraverso componenti custom della griglia. es. BooleanFilter */ });
        const [isGridSettling, setIsGridSettling] = useState<boolean>(false);
        const [gridApiState, setGridApiState] = useState<GridApi | null>(null); //SOLO PER TABLE CONTEXT
        const [isGridReady, setIsGridReady] = useState(false); //SOLO PER TABLE CONTEXT
        const updateFilterRef = useRef<boolean>(false);
        const gridApiRef = useRef<GridApi>(null);
        const USER_SOURCES = new Set([
            'uiColumnMoved', 'uiColumnDragged', 'uiColumnResized',
            'uiColumnSorted', 'columnVisible', 'toolPanelUi', 'contextMenu', 'quickFilter', 'columnFilter'
        ]);
        
        //TABLE ICON AND NAME        
        const tableNameRef = useRef<string>('');
        const [menuItem, setMenuItem] = useState<MenuItem>({} as MenuItem);
        const [customTitle, setCustomTitle] = useState<string | null>(null);
        const [gridDetails, setGridDetails] = useState<GridDetails | null>(null);
        const [hideTitle, setHideTitle] = useState<boolean>(false);

        //custom spinner
        const [loading, setLoading] = useState<boolean>(false);

        const createDatasource = useCallback((serviceLocator: any): IDatasource => {
            const dataSource: IDatasource = {
                rowCount: undefined,
                getRows: async (params) => {

                    setLoading(true);
                    setIsGridSettling(true);

                    // Salva posizione scroll PRIMA del refresh
                    const gridBodyEl = document.querySelector('.ag-body-horizontal-scroll-viewport') as HTMLElement;
                    const savedScrollLeft = gridBodyEl?.scrollLeft ?? 0;

                    const { startRow, endRow, filterModel, sortModel } = params;
                    const blockSize = endRow - startRow;                    // <-- chiave
                    const pageNumber = Math.floor(startRow / blockSize) + 1;

                    const _pageRequest: PageRequest = {
                        pageNumber,
                        pageSize: blockSize,
                    };

                    if (filterModel) {
                        const quickSearchFilter = TableHelper.getCurrentQuickTableFilter(agGridDomainRef.current);
                        if (quickSearchFilter) {
                            _pageRequest.filter = Object.fromEntries(
                                Object.entries(filterModel).map(([k, v]) => [`${k}:qs`, v])
                            );
                        } else {
                            _pageRequest.filter = {
                                ...filterModel
                            }
                        }
                    }

                    if (preFilterRef.current) {
                        //mi assicuro di includere il pre filtro in ogni filtro successivo
                        _pageRequest.filter = {
                            ..._pageRequest.filter,
                            ...preFilterRef.current
                        } as FilterModel;
                    }

                    if (sortModel) {
                        sortModel.forEach(col => {
                            _pageRequest.sort = col.colId + '_' + col.sort.toUpperCase();
                        })
                    }

                    let result = await serviceLocator.callService({
                        service: buildPath(serviceLocatorDomainRef.current, SERVICE_ENDPOINT.LIST),
                        data: _pageRequest,
                        finallyCallback: () => { setLoading(false); },
                        metadata: { user: user }
                    } as ApiRequest);

                    if (result.success) {
                        const {
                            items,
                            pageNumber,
                            hasNextPage,
                            hasPreviousPage,
                            totalPages,
                            totalCount,
                            ...summary
                        } = result.data as PageResponse<T>;
                        setSummary(summary);
                        // handleColumnDefinitions(pageResponse.items);

                        params.successCallback(items, totalCount);

                        // scroll handler - start
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                const el = document.querySelector('.ag-body-horizontal-scroll-viewport') as HTMLElement;
                                if (el) el.scrollLeft = savedScrollLeft;
                                // Sincronizza anche il corpo principale
                                const bodyEl = document.querySelector('.ag-center-cols-viewport') as HTMLElement;
                                if (bodyEl) bodyEl.scrollLeft = savedScrollLeft;
                            });
                        });
                        // scroll handler - end
                        setIsGridReady(true);

                    }
                    else {
                        setIsGridReady(true);
                        params.failCallback();
                    }

                }
            }

            return dataSource;

        }, [serviceLocator, metadata, user]);

        const onGridReady = useCallback((params: GridReadyEvent) => {
            if (typeof params.api.setGridOption === 'function') {
                //rowModelType -> "infinite" needs a datasource to be retrieve dynamically table data
                setIsGridReady(false);

                const datasource = createDatasource(serviceLocator);
                params.api.setGridOption('datasource', datasource);

                //set grid API per filter custom esterno
                if (!gridApiRef?.current) {
                    gridApiRef.current = params.api;
                    setGridApiState(gridApiRef.current);
                }

                //resize action column to fit all the actions
                params.api.autoSizeColumns(["_actions"]);

            }
            else
                console.error("setDatasource is not a function on the grid API. Ensure you are using the correct version of ag-Grid.");

        }, [serviceLocator, metadata]);

        const onColumnResized = (params: ColumnResizedEvent) => {

            if (!USER_SOURCES.has(params.source)) return;

            if (params.finished) {
                if (gridApiRef?.current) {
                    let _gridSettings = TableHelper.saveCurrentColumnStates(agGridDomainRef.current, gridApiRef.current.getColumnState());
                    setGridSettings(_gridSettings);
                }
                    
            }
        };

        const onColumnMoved = useCallback((e: ColumnMovedEvent) => {

            if (!USER_SOURCES.has(e.source)) return;

            if (gridApiRef?.current) {
                let _gridSettings = TableHelper.saveCurrentColumnStates(agGridDomainRef.current, gridApiRef.current.getColumnState());
                setGridSettings(_gridSettings);
            }

        }, []);

        const onColumnVisible = useCallback((e: ColumnVisibleEvent) => {

            if (!USER_SOURCES.has(e.source)) return;

            if (gridApiRef?.current) {
                let _gridSettings = TableHelper.saveCurrentColumnStates(agGridDomainRef.current, gridApiRef.current.getColumnState());
                setGridSettings(_gridSettings);
            }

        }, []);

        const onSortChanged = useCallback((e: any) => {

            if (!USER_SOURCES.has(e.source)) return;

            if (gridApiRef?.current) {
                let _gridSettings = TableHelper.saveCurrentColumnStates(agGridDomainRef.current, gridApiRef.current.getColumnState());
                setGridSettings(_gridSettings);
                TableHelper.resetCurrentTablePage(agGridDomainRef.current);
            }

        }, []);

        const onPaginationChanged = useCallback((e: PaginationChangedEvent) => {

            if (e.newPage && pageRestoredRef.current) {
                const currentPage = e.api.paginationGetCurrentPage();
                TableHelper.saveCurrentTablePage(agGridDomainRef.current, currentPage);
            }

            if (e.newPageSize) {
                const currentPageSize = e.api.paginationGetPageSize();
                TableHelper.saveCurrentTablePageSize(agGridDomainRef.current, currentPageSize);
                setPageSelectorSize(currentPageSize);
            }

        }, []);

        const onFilterChanged = useCallback((e: FilterChangedEvent) => {

            if (!updateFilterRef.current) {
                return;
            }

            if (e.api) {
                const currentFilter = e.api.getFilterModel();

                if (e.fromButtons || e.context?.fromButtons) {
                    //UX - l'utente ha modificato il filtro
                    e.context.fromButtons = false; //reset sempre

                    let isCurrentFilterSaved = activeFilter && activeFilter?.id > 0;

                    let notSavedFilter = {
                        ...activeFilter,
                        _isTemporary: true,
                        _isCandidateForNew: activeFilter && activeFilter?.id == -1,
                        _isNew: false,
                        _isModified: isCurrentFilterSaved,
                        definition: currentFilter
                    } as TableCustomFilter;

                    setActiveFilter(notSavedFilter);
                    TableHelper.saveCurrentTableFilterDetails(agGridDomainRef.current, notSavedFilter);
                }

                TableHelper.saveCurrentTableFilter(agGridDomainRef.current, currentFilter, topBarRef?.current?.quickFilterText());
                TableHelper.resetCurrentTablePage(agGridDomainRef.current);
            }
        }, [activeFilter]);

        const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {

            const selected = event.api.getSelectedRows();

            if (selected.length > 0) {

                let params = {};
                params.data = {};
                params.data.id = selected[0].id;
                let _selected = getRowId(params);

                TableHelper.saveSelectedRow(agGridDomainRef.current, _selected);
            } else {
                TableHelper.removeSelectedRow(agGridDomainRef.current);
            }
        }, []);

        // ===========================================================
        // PAGE RESTORE
        // ===========================================================
        const onFirstDataRendered = useCallback((params: FirstDataRenderedEvent) => {
            if (pageRestoredRef.current) return;
            pageRestoredRef.current = true;

            const saved = Number(
                sessionStorage.getItem(
                    buildPath(agGridDomainRef.current, AG_GRID_STORAGE_KEYS.CURRENT_PAGE)
                ) ?? 0
            );

            if (saved > 0 && saved < params.api.paginationGetTotalPages()) {
                params.api.paginationGoToPage(saved);
            }

            // selezione dopo che la pagina è stata applicata dal grid
            restoreRowSelection(params.api);

            //resize action column to fit all the actions
            params.api.autoSizeColumns(["_actions"]);

        }, []);

        const restoreRowSelection = useCallback((api: GridApi) => {
            const savedId = TableHelper.getSelectedRow(agGridDomainRef.current);
            if (!savedId) return;

            const node = api.getRowNode(savedId);

            if (node) {
                // Blocco già in cache
                node.setSelected(true);
                api.ensureNodeVisible(node, 'middle');
                return;
            }

            // Nodo non ancora caricato: aspetta onModelUpdated
            // e riprova (con guardia per evitare loop)
            const attemptRestore = (e: ModelUpdatedEvent) => {
                const n = e.api.getRowNode(savedId);
                if (!n) return;

                n.setSelected(true);
                e.api.ensureNodeVisible(n, 'middle');
                // Rimuovi il listener dopo il successo
                e.api.removeEventListener('modelUpdated', attemptRestore);
            };

            api.addEventListener('modelUpdated', attemptRestore);
        }, []);

        // ===========================================================
        // FUNZIONI DI APPOGGIO
        // ===========================================================
        const getRowId = function (params: GetRowIdParams) {
            return "R" + params.data.id;
        };

        const loadingOverlayComponentParams = useMemo(() => {
            return { variant: "primary" };
        }, []);

        const getMenuItem = () => {

            let item = {} as MenuItem;
            let iconSize = 40;

            let feature = UiHelper.getMenuFeatureByDomain(agGridDomainRef.current);
            if (feature)
                item = UiHelper.getMenuItem(feature, t, iconSize);

            return item;

        }

        // Memoizzazione degli headers per evitare ricalcoli non necessari
        const _handleColumnDefinitions = useCallback((items: any) => {

            let columnDefinitions = [] as ColDef[];
            columnDefinitions = _loadDefaultColumns(items[0]);

            return columnDefinitions;

        }, [metadata, t, user, domain]);

        const _loadDefaultColumns = useCallback((item: any) => {
            let internalMetadata = {
                agGridDomain: TableHelper._getDomainForAgGrid(agGridDomainRef.current),
                tableName: tableNameRef.current,
                t: t,
                user: user,
                gridApi: gridApiRef?.current,
                actionHandlerRef: actionHandlerRef
            } as TableInternalMetadata;

            let columnDefinitions = TableHelper.getAgGridColumnDefs(item, metadata, internalMetadata);

            return columnDefinitions;
        }, [metadata]);

        //init - set domain
        useEffect(() => {

            let _domain = TableHelper._getDomainForAgGrid(metadata?.domain);
            if (!_domain) return;
            if(metadata?.domain === serviceLocatorDomainRef.current) return;

            agGridDomainRef.current = _domain;
            setDomain({ agGridDomain: _domain, serviceLocatorDomain: metadata?.domain });
            serviceLocatorDomainRef.current = metadata?.domain;

            //reset colonne per visualizzare il caricamento
            setColumnDefs([]);

            tableNameRef.current = getTranslation(t, _domain + '.name');
            let _menuItem = getMenuItem(_domain);
            setMenuItem(_menuItem);

            preFilterRef.current = metadata?.preFilter ?? null;

        }, [metadata, t]);
        
        //init - quando il domain è settato
        useEffect(() => {

            //fetch first row per ricavare le colDefs e costruire la tabella 
            //la griglia aspetta le colDefs per inizializzarsi
            //carico le colDefs
            _fetchColumnDefinitions();

            //imposto la visibilità del title della tabella
            setHideTitle(metadata?.hideTitle ?? false);
            setCustomTitle(metadata?.customTitle ?? null);
            setGridDetails(metadata?.gridDetails ?? null);
    
        }, [domain]);

        const _fetchColumnDefinitions = useCallback(async () => {

            if (!serviceLocatorDomainRef.current) return;

            const pageNumber = 1;
            let _pageRequest = { pageNumber: pageNumber, pageSize: 1 } as PageRequest;

            let result = await serviceLocator.callService({
                service: buildPath(serviceLocatorDomainRef.current, SERVICE_ENDPOINT.LIST),
                data: _pageRequest,
                finallyCallback: () => { setLoading(false); },
                metadata: { user: user }
            } as ApiRequest);

            if (result.success) {
                let pageResponse = result.data as PageResponse<T>;
                let colDefs = _handleColumnDefinitions(pageResponse.items);
                setColumnDefs(colDefs);
            }

        }, [domain]);

        //INITIAL STATE CONFIG
        const initialState = useMemo<GridState | undefined>(() => {

            // console.log('[initialState] ricalcolo', {
            //     domain: domain?.agGridDomain,
            //     columnDefsLength: columnDefs?.length,
            //     agGridDomainRef: agGridDomainRef.current,
            // });

            if (!domain) return undefined;
            if (!columnDefs || columnDefs.length === 0) return undefined;

            const _defaultColumnDefs = columnDefs;
            let columnState = [] as ColumnState[];

            // preferenze sessione corrente
            const currentColumnStates = TableHelper.getCurrentColumnStates(agGridDomainRef.current);
            if (currentColumnStates?.length > 0) {
                const purged = TableHelper.purgeColumnStates(currentColumnStates, _defaultColumnDefs);
                const currentGridSettings = getFromSession(buildPath(domain.agGridDomain, AG_GRID_STORAGE_KEYS.COLUMN_PREFERENCES));
                if(currentGridSettings) {
                    setGridSettings({ 
                        ...currentGridSettings,
                        settings: purged
                    });
                }

                columnState = purged;
            }

            // preferenze localStorage
            if (columnState.length === 0) {
                const localUGS = TableHelper.getUserGridSettingsFromLocalSession(agGridDomainRef.current);
                if (!isEmptyObject(localUGS)) {
                    const purged = TableHelper.purgeColumnStates(localUGS.settings as ColumnState[], _defaultColumnDefs);

                    let _gridSettings = TableHelper.saveCurrentColumnStates(agGridDomainRef.current, purged, true);
                    setGridSettings(_gridSettings);
                    columnState = purged;
                }
            }

            const savedFilter = TableHelper.getCurrentTableFilter(agGridDomainRef.current);
            const savedPageSize = TableHelper.getCurrentTablePageSize(agGridDomainRef.current, metadata?.defaultPageRequest?.pageSize ?? AG_GRID_DEFAULT_PAGE_SIZE);

            const state: GridState = {
                pagination: { pageSize: savedPageSize },
                filter: { filterModel: isEmptyObject(savedFilter) ? (activeFilter ? activeFilter?.definition : {}) : savedFilter },
            };

            const order = columnState.map(c => c.colId).filter(Boolean);
            if (order.length > 0) state.columnOrder = { orderedColIds: order };

            const hiddenColIds = columnState.filter(c => c.hide).map(c => c.colId);
            const leftColIds = columnState.filter(c => c.pinned === 'left').map(c => c.colId);
            const rightColIds = columnState.filter(c => c.pinned === 'right').map(c => c.colId);

            if (hiddenColIds.length > 0) state.columnVisibility = { hiddenColIds };
            if (leftColIds.length > 0 || rightColIds.length > 0) {
                state.columnPinning = { leftColIds, rightColIds };
            }

            const sizing = columnState.filter(c => c.width != null).map(c => ({ colId: c.colId, width: c.width! }));
            if (sizing.length > 0) state.columnSizing = { columnSizingModel: sizing };

            const sortModel = columnState.filter(c => c.sort).map(c => ({ colId: c.colId, sort: c.sort! }));
            if (sortModel.length > 0) state.sort = { sortModel };

            // const currentDomain = agGridDomainRef.current;
            // console.log('[initialState] currentDomain:', currentDomain);
            // console.log('[initialState] getCurrentColumnStates:', TableHelper.getCurrentColumnStates(currentDomain));
            // console.log('[initialState] getCurrentTableFilter:', TableHelper.getCurrentTableFilter(currentDomain));

            setTimeout(() => {
                // impedisce il reset della current page all'init 
                // necessario perchè
                // onFilterChange non distingue tra init e modifica utente
                updateFilterRef.current = true;
            }, 1000);

            return state;
        }, [columnDefs, domain, activeFilter]);

        const onGridPreDestroyed = useCallback(() => {
            // Pulisce la datasource per evitare chiamate al server dopo che la griglia è stata distrutta
            gridApiRef.current = null;
            setGridApiState(null);
            setIsGridReady(false);
            updateFilterRef.current = false;

            preFilterRef.current = null;
        }, []);

        //isGridSettling
        useEffect(() => {

            //delay per visualizzazione griglia
            //serve per dare il tempo alle colonne di
            //riposizionarsi e ridimensionarsi
            if (!isGridSettling) return;

            setTimeout(() => {
                setIsGridSettling(false);
            }, 350);

        }, [isGridSettling]);

        //TOP BAR CONFIG - Actions metadata - Quick filter metadata - Top bar metadata
        useEffect(() => {

            if(!agGridDomainRef.current) return;
            if(!isGridReady) return;

            let actionsMetadata = {} as ActionsMetadata;
            actionsMetadata.actionsConfig = metadata?.columns?._actions.params?.actions;
            actionsMetadata.domain = agGridDomainRef.current;
            actionsMetadata.tableName = tableNameRef.current;

            let quickFilterMetadata = {} as QuickFilterMetadata;
            quickFilterMetadata.searchFilterColumns = metadata?.searchFilterColumns;
            quickFilterMetadata.translatedSearchFilterColumns = metadata?.searchFilterColumns?.map(col => {
                return getTranslation(t, buildPath(agGridDomainRef.current, 'columns', col));
            });
            quickFilterMetadata.domain = agGridDomainRef.current;

            let topBarMetadata = {} as TableTopBarMetadata;
            topBarMetadata.actionsMetadata = actionsMetadata;
            topBarMetadata.quickFilterMetadata = quickFilterMetadata;
            topBarMetadata.actionBarConfig = metadata.actionBarConfig;
            setTopBarMetadata(topBarMetadata);

            let _columnChooserProps = {
                domain: agGridDomainRef.current,
                tableName: tableNameRef.current,
                gridApi: gridApiRef?.current,
                defaultColumnDefs: columnDefs ?? [],
                shouldOpenModal: openColumnChoser,
                onCloseModal: () => { setOpenColumnChoser(false); },
                metadata: {
                    protectedColumns: metadata.protectedColumns ?? [],
                    systemColumns: metadata.systemColumns ?? []
                }
            } as ColumnChooserModalProps;
            setColumnChooserProps(_columnChooserProps);

            //ripristino del filter
            const quickSearchFilter = TableHelper.getCurrentQuickTableFilter(agGridDomainRef.current);
            topBarRef?.current?.setQuickFilterText(quickSearchFilter);

        }, [isGridReady, metadata, columnDefs, openColumnChoser]);

        //customTitle
        useEffect(() => {

            if (customTitle != null)
                tableNameRef.current = customTitle;

        }, [customTitle]);

        return (

            domain && (
                <TableProvider 
                    metadata={metadata} 
                    domain={{ agGridDomain: agGridDomainRef.current, serviceLocatorDomain: serviceLocatorDomainRef.current }} 
                    gridApi={gridApiState} 
                    isGridReady={isGridReady} 
                    activeFilter={activeFilter} 
                    setActiveFilter={setActiveFilter}
                    gridSettings={gridSettings} 
                    setGridSettings={setGridSettings}
                    summary={summary}
                    setSummary={setSummary}
                    isLoadingGridData={loading}
                    >
                <>
                    <Container fluid className="ids-generic-table-container w-100 mt-3">
                        {!hideTitle &&
                            <h1 className="text-start d-flex align-items-center m-0 mt-2 mb-2 ms-2">
                                <span className="me-2 pb-2">{menuItem.icon}</span>
                                <span>{tableNameRef.current}</span>
                            </h1>
                        }

                        {!hideTitle && menuItem.descritpion &&
                            <p className="mb-4 mt-0 ms-2 pt-2 fst-italic">
                                {menuItem.descritpion}
                            </p>
                        }

                        <TableTopBar ref={topBarRef} metadata={topBarMetadata} gridApiRef={gridApiRef} openColumnChooser={() => setOpenColumnChoser(true)}></TableTopBar>
                        <ColumnChooserModal
                            domain={columnChooserProps.domain}
                            tableName={columnChooserProps.tableName}
                            gridApi={columnChooserProps.gridApi}
                            defaultColumnDefs={columnChooserProps.defaultColumnDefs}
                            metadata={columnChooserProps.metadata}
                            shouldOpenModal={columnChooserProps.shouldOpenModal}
                            onCloseModal={() => { columnChooserProps.onCloseModal(); }}
                            >
                        </ColumnChooserModal>

                        {gridDetails &&
                            <Card className="mb-1 mt-0 ms-0 w-100">
                                <CardBody className="small">
                                    {gridDetails.title && (<span className="fw-bold pe-1" style={{color: UiHelper.getColor(IdsColor.PRIMARY).color}}>{gridDetails.title}</span>)}
                                    <span className="fst-italic">{gridDetails.content}</span>
                                </CardBody>
                            </Card>
                        }

                        {columnDefs?.length > 0 &&
                        <AgGridReact<T>
                            context={gridContext.current}
                            key={domain.serviceLocatorDomain}
                            initialState={initialState}
                            loading={loading || isGridSettling}
                            loadingOverlayComponent={LoadingOverlay}
                            loadingOverlayComponentParams={loadingOverlayComponentParams}
                            localeText={AG_GRID_LOCALE_IT}
                            className="ids-generic-table"
                            columnDefs={columnDefs}

                            //infinite row model
                            rowModelType={"infinite"}
                            cacheBlockSize={AG_GRID_ROW_BLOCK_SIZE} //numero di righe per blocco. Una chiamata al server per ogni blocco
                            maxBlocksInCache={4} // Numero massimo di blocchi nella cache per la tabella

                            pagination={true}
                            paginationPageSize={pageSelectorSize}
                            paginationAutoPageSize={false}
                            paginationPageSizeSelector={AG_GRID_PAGE_SIZE_SELECTOR}

                            rowSelection={{
                                mode: 'singleRow',          // oppure 'multiRow'
                                checkboxes: false,          // true se vuoi le checkbox
                                enableClickSelection: true, // selezione cliccando sulla riga (era il default del vecchio "single")
                            }}

                            //callbacks
                            getRowId={getRowId}
                            onGridReady={onGridReady}
                            onColumnVisible={onColumnVisible}
                            onColumnMoved={onColumnMoved}
                            onSortChanged={onSortChanged}
                            onColumnResized={onColumnResized}
                            onFilterChanged={onFilterChanged}
                            onPaginationChanged={onPaginationChanged}
                            onFirstDataRendered={onFirstDataRendered}
                            onGridPreDestroyed={onGridPreDestroyed}
                            onSelectionChanged={onSelectionChanged}
                        />}
                        <GenericTableSummary />
                    </Container>
                    <GenericActionHandler ref={actionHandlerRef} />
                </>
            </TableProvider> 
        )
        );
    };


export const GenericTableSummary = () => {

    const tableContext = useTableContext();
    const summary = tableContext.summary;
    const t = useTranslations();
    const domain = tableContext.domain;
    const meta = tableContext.metadata;

    const excludes = meta?.summary?.excludes ?? [];

    let isLoading = tableContext.isLoadingGridData;

    const formatValue = (v: any) => {

        if(typeof(v) == 'number') {

            if (v.toString().indexOf('.') != -1 || v.toString().indexOf(',') != -1) {
                //float                
                return formatAs(v, DataFormat.CURRENCY);
            }

            else v;

        }

        return v;

    }

    return (<>
        {!isLoading && !isEmptyObject(summary) && 
        
        <div className="ids-generic-table-summary">
            {Object.entries(summary).map(([k,v], idx) => (
                <>
                    {!excludes.includes(k) && <span className="small ms-3">
                        <span >{getTranslation(t, buildPath(domain?.agGridDomain, 'summary', k))}:</span>
                        <span className="ms-1 me-2 fw-bold">{formatValue(v)}</span>

                    </span>}
                </>
            ))}
            
        
        </div>
        }
    </>);

}
