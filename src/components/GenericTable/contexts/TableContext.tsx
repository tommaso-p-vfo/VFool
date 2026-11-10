import React, { createContext, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";

import { IServiceLocator } from '../../../types/api/IServiceLocator';  
import { type ApiRequest } from "../../../types/api/ApiRequest";
import { buildPath } from "../../../utils/Path";

import type { TableMetadata } from "../types/TableMetadata";
import type { TableComboboxOption } from "../components/cell-renderers/components/TableCombobox";

import { SERVICE_ENDPOINT } from "../../../types/api/ApiEndpoints";
import { type FilterModel } from "../../../types/api/FilterModel";

import type {
    GridApi,
} from "ag-grid-community";

import { removeFromSession } from "../../../utils/StorageHelper";
import { AG_GRID_STORAGE_KEYS } from "../constants/tableStorageConstants";

import { type TableUserFilter } from "../types/TableCustomFilter";
import { TableCustomSetting } from "../types/TableCustomSettings";

// TODO fix useCustomFiltersLogic e useGridSettingsLogic
// import { useCustomFilterLogic, type TableCustomFilterHandler } from "../components/custom-filter/hooks/useCustomFiltersLogic";
// import { useGridSettingsLogic, type GridSettingsHandler } from "../components/column-preferences/hooks/useGridSettingsLogic";

import type { PageRequest } from "../../../types/api/PageTypes";
import { AG_GRID_COLUMN_TYPE } from "../constants/tableConstants";
import { TableTranslation } from "../types/TableTranslation";
import { TableApperance, TableColumnConfig, TableDataConnector, TableFilterConfig, TableFilterHandler, TableSummaryConfig, TableTranslations } from "../types/TableAttributes";
import { TableFilterInternalHandler, useCustomFilterLogic } from "../components/custom-filter/hooks/useCustomFiltersLogic";

export type AgGridDomainType = {

    //distinzione introdotta per specializzare
    //il service locator a eseguire chiamate filtrate a prescindere
    //dal filtro della ag grid

    agGridDomain: string; //dominio ripulito per lavorare con ag grid
    serviceLocatorDomain: string | null; //dominio puro necessario al service locator
}

export type SummaryHandler = {
    data: any; //totali tabella da mostrare nel footer
    config: TableSummaryConfig|undefined;
};

export type TableSavedFilterHandler = {
    savedFilters: TableUserFilter[];
    existFilter: (filterId: number) => boolean;
    applyFilter: (filterId: number) => Promise<void>;
    addFilter: (filter: TableUserFilter) => Promise<TableUserFilter>;
    updateFilter: (filter: TableUserFilter) => Promise<void>;
    removeFilter: (filter: TableUserFilter) => Promise<void>;
    refreshSavedFilters: (activeFilter?: TableUserFilter, forceActiveFilterReset?: boolean) => Promise<void>;
}

/**
 * context pubblico
 */
export type TableContextHandler = {
    appearance?: TableApperance;
    filterHandler?: TableFilterHandler;

    savedFiltersHandler?: TableSavedFilterHandler;

    gridApi: GridApi | null;
}

/**
 * context interno
 */
export interface TableInternalContextHandler {
    appearance?: TableApperance;
    filterHandler: TableFilterInternalHandler;
    

    domain: AgGridDomainType | undefined;
    serviceLocator: IServiceLocator;
    t: TableTranslation;
    
    // metadata: TableMetadata<any> | undefined;
    comboboxMap: Map<string, TableComboboxOption[]>;
    listsMap: Map<string, { id: string, name: string, raw: any }[]>;
    fetchLists: (request?: PageRequest) => Promise<void>;
    isLoadingData: boolean;
    gridApi: GridApi | null;
    isGridReady: boolean;
    data: any;
    
    
    //TODO fix types
    gridSettingsHandler: any; // GridSettingsHandler;
    summaryHandler?: SummaryHandler; 
    isLoadingGridData: boolean; //items loading from server
}

const TableContext = createContext<TableInternalContextHandler | undefined>(undefined);

interface TableProviderProps {
    children: React.ReactNode;
    dataConnector: TableDataConnector;
    translations: TableTranslations;
    filterConfig?: TableFilterConfig;
    columnsConfig?: { [colName: string]: TableColumnConfig; };
    appearance?: TableApperance;
    
    userFilter: TableUserFilter | undefined;
    setUserFilter: (filter?: TableUserFilter) => void; 

    gridApi: GridApi | null;


    serviceLocator: IServiceLocator;
    // metadata: TableMetadata<any>;
    domain?: AgGridDomainType|undefined;
    isGridReady: boolean;
    gridSettings: TableCustomSetting |undefined;
    setGridSettings: (gridSettings?: TableCustomSetting) => void;
    
    summaryHandler?: SummaryHandler;

    isLoadingGridData: boolean; //loading data items from server
}

const TableProvider = forwardRef<TableInternalContextHandler, TableProviderProps>(({ 
    children, 
    appearance,
    dataConnector,
    translations,

    columnsConfig,
    filterConfig,

    userFilter, 
    setUserFilter, 

    serviceLocator, 
    // metadata, 
    domain, 
    gridApi, 
    isGridReady, 
    gridSettings, 
    setGridSettings, 
    summaryHandler, 
    isLoadingGridData 
}: TableProviderProps, ref) => {

    const filterHandler = useCustomFilterLogic({
        filterConfig,
        serviceLocator,
        domain, 
        gridApi, 
        userFilter, 
        setUserFilter 
    });
    
    //TODO fix useGridSettingsLogic
    const gridSettingsHandler = {}; //useGridSettingsLogic(domain, gridSettings, setGridSettings, serviceLocator);

    const [comboboxMap, setComboboxMap] = useState<Map<string, TableComboboxOption[]>>(new Map());  //AG_GRID_COLUMN_TYPE.COMBOBOX se hanno domain

    const [listsMap, setListsMap] = useState<Map<string, { id: string, name: string, raw: any }[]>>(new Map()); //AG_GRID_COLUMN_TYPE.LIST se hanno domain

    const [data, setData] = useState<Map<string, any>>(new Map());
    const [_domain, setDomain] = useState<AgGridDomainType | undefined>();

    const [isLoadingData, setIsLoadingData] = useState(false);

    const t = translations ?? {} as TableTranslation;

    useEffect(() => {
      
        if(!domain) return;

        setDomain(domain);

    }, [domain]);

    useEffect(() => {
        //se il dominio cambia durante la fruizione della ag grid (es. inOnlyMineFilter)
        if (!_domain) return;

        let prevServiceLocatorDomain = _domain?.serviceLocatorDomain ?? null;
        let newServiceLocatorDomain = domain?.serviceLocatorDomain ?? prevServiceLocatorDomain;

        if (prevServiceLocatorDomain !== newServiceLocatorDomain) {
            // se cambio dominio/table,
            // pulisco le preferenze di pagina salvate in sessione per evitare di ritrovarmi su pagine non esistenti
            removeFromSession(buildPath(_domain.agGridDomain, AG_GRID_STORAGE_KEYS.CURRENT_PAGE));
        }

    }, [_domain]);

    const fetchLists = useCallback(async (request?: PageRequest) => {

        if (!columnsConfig || Object.keys(columnsConfig).length === 0) return;

        setIsLoadingData(true);
        try {
            const map = new Map<string, { id: number, name: string, raw: any }[]>();

            for (const [key, column] of Object.entries(columnsConfig)) {
                if (column && column.type === AG_GRID_COLUMN_TYPE.LIST) {
                    if (!column.domain) continue;

                    // sort: { colId: 'name', sort:'DESC'}

                    let _request = { pageNumber: 1, pageSize: 100, sort: { colId: 'name', sort:'DESC'} } as PageRequest;
                    _request = {
                        ..._request,
                        ...request
                    }


                    const apiRequest = { service: buildPath(column.domain, SERVICE_ENDPOINT.LIST), data: _request } as ApiRequest;
                    const list = await serviceLocator.callService(apiRequest);
                    map.set(column.domain, list?.data?.items.map(i => ({ id: i.id ?? '', name: i.name ?? '', raw: i })) ?? []);
                }
            }

            setListsMap(map);
        } catch (err) {
            console.error("Failed to fetch list column info", err);
        } finally {
            setIsLoadingData(false);
        }
    }, [columnsConfig, serviceLocator]);

    const fetchDropdowns = useCallback(async () => {

        if (!columnsConfig || Object.keys(columnsConfig).length === 0) return;

        setIsLoadingData(true);
        try {
            const map = new Map<string, TableComboboxOption[]>();

            for (const [key, column] of Object.entries(columnsConfig)) {
                if (column && column.type === AG_GRID_COLUMN_TYPE.BOXED_COMBOBOX) {
                    if (!column.domain) continue;

                    const request = { service: buildPath(column.domain, SERVICE_ENDPOINT.LIST) } as ApiRequest;
                    const options = await serviceLocator.callService(request);
                    map.set(column.domain, options?.data?.items ?? []);
                }
            }

            setComboboxMap(map);
        } catch (err) {
            console.error("Failed to fetch dropdown options", err);
        } finally {
            setIsLoadingData(false);
        }
    }, [columnsConfig, serviceLocator]);

    const fetchData = useCallback(async () => {

        if (!dataConnector || !dataConnector.extraData) return;

        setIsLoadingData(true);
        try {
            const map = new Map<string, any>();

            for (const [key, cData] of Object.entries(dataConnector.extraData)) {
                if (cData) {
                    if (!cData.service) continue;

                    const request = { 
                        service: cData.service,
                        data: cData.params
                     } as ApiRequest;

                    const data = await serviceLocator.callService(request);
                    map.set(cData.name, data?.data ?? {});
                }
            }

            setData(map);
        } catch (err) {
            console.error("Failed to fetch data", err);
        } finally {
            setIsLoadingData(false);
        }
    }, [dataConnector, serviceLocator]);

    useEffect(() => {
        fetchLists();
        fetchDropdowns();
        fetchData();
    }, [fetchDropdowns, fetchLists, fetchData]);

    const value = useMemo<TableInternalContextHandler>(() => ({
        appearance,    
        filterHandler,        

        domain,
        serviceLocator,
        t,

        // metadata,
        comboboxMap,
        listsMap,
        isLoadingData,
        gridApi,
        isGridReady,
        data,

        fetchLists,
        
        gridSettingsHandler,
        summaryHandler,
        isLoadingGridData
    }), [

        appearance,
        filterHandler,

        domain,
         serviceLocator,
         t,

        //  metadata, 
         comboboxMap, 
         listsMap, 
         isLoadingData, 
         gridApi, 
         isGridReady, 
         data, 
          
         gridSettingsHandler, 
         summaryHandler, 
         isLoadingGridData
        ]);


    useImperativeHandle(ref, () => {
        return value;
    }, [value]);

    return (
        <TableContext.Provider value={value}>
            {children}
        </TableContext.Provider>
    );
});

export { TableContext };
export default TableProvider;