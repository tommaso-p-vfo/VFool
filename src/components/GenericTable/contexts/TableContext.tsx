import React, { createContext, useCallback, useEffect, useMemo, useState, type RefObject } from "react";
import type { TableMetadata } from "../types/TableMetadata";
import type { TableComboboxOption } from "../components/cell-renderers/components/TableCombobox";
import { AG_GRID_COLUMN_TYPE, AG_GRID_FILTER_TYPE } from "../constants/agGridConstants";
import { useAppContext } from "../../../../core/context/hooks/useAppContext";
import type ApiRequest from "../../../../types/system/api/ApiRequest";
import { AppPathHelper } from "../../../../core/helpers/AppPathHelper";
import { SERVICE_ENDPOINT } from "../../../../core/service-locator/constants/locatorPath";
import { type FilterModel } from "../../../../types/system/api/FilterModel";

import type {
    GridApi,
} from "ag-grid-community";
import { StorageHelper } from "../../../../storage/helpers/StorageHelper";
import STORAGE from "../../../../storage/constants/storage";
import type { UserCustomFilter } from "../../../../types/dto/UserCustomFilter";
import { useCustomFilterLogic, type UserCustomFilterHandler } from "../components/custom-filter/hooks/useCustomFiltersLogic";
import { useGridSettingsLogic, type GridSettingsHandler } from "../components/column-preferences/hooks/useGridSettingsLogic";
import type { UserGridSetting } from "../../../../types/dto/UserGridSetting";
import type { PageRequest } from "../../../../types/dto/PageTypes";

export type AgGridDomainType = {

    //distinzione introdotta per specializzare
    //il service locator a eseguire chiamate filtrate a prescindere
    //dal filtro della ag grid

    agGridDomain: string; //dominio ripulito per lavorare con ag grid
    serviceLocatorDomain: string | null; //dominio puro necessario al service locator
}

export interface TableContextType {
    domain: AgGridDomainType | undefined;
    metadata: TableMetadata<any> | undefined;
    comboboxMap: Map<string, TableComboboxOption[]>;
    listsMap: Map<string, { id: string, name: string, raw: any }[]>;
    fetchLists: (request?: PageRequest) => Promise<void>;
    isLoadingData: boolean;
    filterData: FilterModel | undefined,
    setFilterData: (filter: FilterModel | undefined) => void;
    gridApi: GridApi | null;
    isGridReady: boolean;
    data: any;
    customFilterHandler: UserCustomFilterHandler;
    gridSettingsHandler: GridSettingsHandler;
    summary: any; //totali tabella da mostrare nel footer
    isLoadingGridData: boolean; //items loading from server
}

const TableContext = createContext<TableContextType | undefined>(undefined);

interface TableProviderProps {
    children: React.ReactNode;
    metadata: TableMetadata<any>;
    domain?: AgGridDomainType|undefined;
    gridApi: GridApi | null;
    isGridReady: boolean;
    activeFilter: UserCustomFilter|undefined;
    setActiveFilter: (filter?: UserCustomFilter) => void; 
    gridSettings: UserGridSetting|undefined;
    setGridSettings: (gridSettings?: UserGridSetting) => void;
    summary: any|undefined; 
    setSummary: (summary: any) => void;
    isLoadingGridData: boolean; //loading data items from server
}

const TableProvider = ({ children, metadata, domain, gridApi, isGridReady, activeFilter, setActiveFilter, gridSettings, setGridSettings, summary, setSummary, isLoadingGridData }: TableProviderProps) => {

    const appContext = useAppContext();
    const serviceLocator = appContext.serviceLocator;

    const customFilterHandler = useCustomFilterLogic({ domain, gridApi, activeFilter, setActiveFilter });
    const gridSettingsHandler = useGridSettingsLogic(domain, gridSettings, setGridSettings);

    const [filterData, setFilterData] = useState<FilterModel>(); //filtro che viene applicato a prescindere dalle interazioni utente: es. filtro 'solo mie'

    const [comboboxMap, setComboboxMap] = useState<Map<string, TableComboboxOption[]>>(new Map());  //AG_GRID_COLUMN_TYPE.COMBOBOX se hanno domain

    const [listsMap, setListsMap] = useState<Map<string, { id: string, name: string, raw: any }[]>>(new Map()); //AG_GRID_COLUMN_TYPE.LIST se hanno domain

    const [data, setData] = useState<Map<string, any>>(new Map());
    const [_domain, setDomain] = useState<AgGridDomainType | undefined>();

    const [isLoadingData, setIsLoadingData] = useState(false);

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
            StorageHelper.removeFromSession(AppPathHelper.build(_domain.agGridDomain, STORAGE.CURRENT_PAGE));
        }

    }, [_domain]);

    const fetchLists = useCallback(async (request?: PageRequest) => {

        if (!metadata || Object.keys(metadata).length === 0) return;

        setIsLoadingData(true);
        try {
            const map = new Map<string, { id: number, name: string, raw: any }[]>();

            for (const [key, column] of Object.entries(metadata.columns)) {
                if (column && column.type === AG_GRID_COLUMN_TYPE.LIST) {
                    if (!column.domain) continue;

                    // sort: { colId: 'name', sort:'DESC'}

                    let _request = { pageNumber: 1, pageSize: 100, sort: { colId: 'name', sort:'DESC'} } as PageRequest;
                    _request = {
                        ..._request,
                        ...request
                    }


                    const apiRequest = { service: AppPathHelper.build(column.domain, SERVICE_ENDPOINT.LIST), data: _request } as ApiRequest;
                    const list = await serviceLocator.callService(apiRequest);
                    map.set(column.domain, list?.data?.items.map(i => ({ id: i.id ?? '', name: i.name ?? '', raw: i })) ?? []);
                }
            }

            setListsMap(map);
        } catch (err) {
            console.error("Failed to fetch dropdown options", err);
        } finally {
            setIsLoadingData(false);
        }
    }, [metadata, serviceLocator]);

    const fetchDropdowns = useCallback(async () => {

        if (!metadata || Object.keys(metadata).length === 0) return;

        setIsLoadingData(true);
        try {
            const map = new Map<string, TableComboboxOption[]>();

            for (const [key, column] of Object.entries(metadata.columns)) {
                if (column && column.type === AG_GRID_COLUMN_TYPE.BOXED_COMBOBOX) {
                    if (!column.domain) continue;

                    const request = { service: AppPathHelper.build(column.domain, SERVICE_ENDPOINT.LIST) } as ApiRequest;
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
    }, [metadata, serviceLocator]);

    const fetchData = useCallback(async () => {

        if (!metadata || Object.keys(metadata).length === 0 || !metadata.contextDataConfig) return;

        setIsLoadingData(true);
        try {
            const map = new Map<string, any>();

            for (const [key, cData] of Object.entries(metadata.contextDataConfig)) {
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
    }, [metadata, serviceLocator]);

    useEffect(() => {
        fetchLists();
        fetchDropdowns();
        fetchData();
    }, [fetchDropdowns, fetchData]);

    const value = useMemo<TableContextType>(() => ({
        domain,
        metadata,
        comboboxMap,
        listsMap,
        fetchLists,
        isLoadingData,
        filterData, 
        setFilterData,
        gridApi,
        isGridReady,
        data,
        customFilterHandler,
        gridSettingsHandler,
        summary,
        isLoadingGridData
    }), [domain, metadata, comboboxMap, listsMap, filterData, isLoadingData, gridApi, isGridReady, data, customFilterHandler, gridSettingsHandler, summary, isLoadingGridData]);

    return (
        <TableContext.Provider value={value}>
            {children}
        </TableContext.Provider>
    );
};

export { TableContext };
export default TableProvider;