//TODO user is not defined - deve arrivare da auth. Il filtro non dovrebbe sapere nulla della chiamata, dovrebbe solo passare la definition

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ColDef, FilterModel, GridApi } from "ag-grid-community";

import { type TableCustomFilter } from "../../../types/TableCustomFilter";

import { AG_GRID_STORAGE_KEYS } from "../../../constants/tableStorageConstants";
import { getFromSession } from "../../../../../utils/StorageHelper";

import { SERVICE_ENDPOINT } from "../../../../../constants/apiConstants";
import { TABLE_API_KEYS } from "../../../constants/tableApiConstants";
import { buildPath } from "../../../../../utils/Path";

import type { AgGridDomainType } from "../../../contexts/TableContext";
import { IServiceLocator } from "../../../../../types/api/IServiceLocator";
import { ApiRequest } from "../../../../../types/api/ApiRequest";
import { TableHelper } from "../../../helpers/TableHelper";
import { AG_GRID_FILTER_TYPE } from "../../../constants/tableConstants";

export type TableCustomFilterHandler = {
    serviceLocator: IServiceLocator;
    cols: ColDef[];
    activeFilter: TableCustomFilter |undefined;
    customFilters: TableCustomFilter[];
    updateDefaultFilter: (filterId: number) => Promise<void>;
    applyFilter: (filterId: number) => Promise<void>;
    isFilterApplied: (filter: TableCustomFilter) => boolean,
    existFilter: (filterId: number) => boolean;
    addFilter: (filter: TableCustomFilter) => Promise<TableCustomFilter>;
    updateFilter: (filter: TableCustomFilter) => Promise<void>;
    removeFilter: (filter: TableCustomFilter) => Promise<void>;
    refreshCustomFilters: () => void;
    resetActiveFilter: () => void;
    
}

export const useCustomFilterLogic = ({ serviceLocator, domain, gridApi, activeFilter, setActiveFilter }: { serviceLocator: IServiceLocator, domain: AgGridDomainType | undefined, gridApi: GridApi | null, activeFilter: TableCustomFilter | undefined, setActiveFilter: (filter?: TableCustomFilter) => void }) => {

    //TODO. user definition
    // const auth = useAuth();
    // const user = auth.user;
    const user = {}
    
    const [pendingActivationFilter, setPendingActivationFilter] = useState<TableCustomFilter | undefined>();
    const [customFilters, setCustomFilters] = useState<TableCustomFilter[]>([]);

    const cols = useMemo(() => 
        gridApi?.getColumnDefs()?.filter(c => !c?.colId?.startsWith('_')
    ), [gridApi]);

    const isFilterApplied = useCallback((filter: TableCustomFilter): boolean => {
        return activeFilter?.id === filter.id;
    }, [activeFilter]);


    const existFilter = (filterId: number): boolean => {
        return !!customFilters?.find(f => f.id === filterId);
    }

    const applyFilter = async (filterId: number): Promise<void> => {

        let filterToApply = customFilters?.find(f => f.id === filterId);
        gridApi?.setFilterModel(filterToApply?.definition);
        activateFilter(filterToApply);

        //Pulisci lista dei filtri temporanei se presenti
    }

    const activateFilter = useCallback((filter?: TableCustomFilter) => {

        if (!customFilters) return;

        if (filter && (filter._isTemporary || filter._isModified || filter?._isNew)) {
            setActiveFilter(filter);
            setFilterDetails(filter);
            gridApi?.setFilterModel(filter.definition ?? {});
            return;
        }

        if (filter && filter.id > 0) {
            let savedFilter = customFilters.filter(f => f.id == filter.id);
            if (savedFilter.length > 0) {
                setActiveFilter(savedFilter[0]);
                setFilterDetails(savedFilter[0]);
                gridApi?.setFilterModel(savedFilter[0].definition);
                return;
            }
        }

        if(filter && filter.id === -1 && filter._isCandidateForNew) {
            //filtro tmp in sessione e non ancora salvato
            setActiveFilter(filter);
            setFilterDetails(filter);
            gridApi?.setFilterModel(filter.definition);
            return;
        }

        let defaultFilters = customFilters.filter(f => f.isDefault);

        if (defaultFilters && defaultFilters.length > 0) {

            //applico il preferito

            setActiveFilter(defaultFilters[0]);
            setFilterDetails(defaultFilters[0]);
            gridApi?.setFilterModel(defaultFilters[0].definition);
        }
        else {

            //retituisco un filtro da sessione o vuotp

            let currentFilter = TableHelper.getCurrentTableFilter(domain?.agGridDomain);
            let currentFilterDetails = TableHelper.getCurrentTableFilterDetails(domain?.agGridDomain);
            if (currentFilter && currentFilterDetails.id) {
                setActiveFilter({
                    id: currentFilterDetails.id,
                    name: currentFilterDetails.name,
                    isDefault: currentFilterDetails.isDefault ?? false,
                    _isTemporary: currentFilterDetails._isTemporary ?? true,
                    _isCandidateForNew: currentFilterDetails._isCandidateForNew ?? false,
                    _isModified: currentFilterDetails._isModified ?? false,
                    definition: currentFilter
                } as TableCustomFilter);
                setFilterDetails(currentFilterDetails);
                gridApi?.setFilterModel(currentFilter);
            }
            else
                resetActiveFilter();

        }
    }, [customFilters]);

    const updateDefaultFilter = async (filterId: number): Promise<void> => {
        
    }

    const addFilter = useCallback(async (filter: TableCustomFilter): Promise<TableCustomFilter> => {

        let _domain = domain?.agGridDomain ?? '';
        let service = buildPath(_domain, TABLE_API_KEYS.TABLE_CUSTOM_FILTER, SERVICE_ENDPOINT.SAVE);
        
        let data = {
            userId: user.id,
            entityName: _domain,
            isDefault: false, //filter.isDefault,
            name: filter.name,
            definition: JSON.stringify(filter.definition)
        } as TableCustomFilter;

        let response = await serviceLocator.callService({ service, data } as ApiRequest);
        
        if(response.success){
            refreshCustomFilters({ id: response.data } as TableCustomFilter);
        }

        return response.data;
    }, [serviceLocator, domain]);

    const updateFilter = useCallback(async (filter: TableCustomFilter): Promise<void> => {

        //ricarica i custom filters
        //aggiorna il filtro attivo se è quello modificato

        let _domain = domain?.agGridDomain ?? '';
        let service = buildPath(_domain, TABLE_API_KEYS.TABLE_CUSTOM_FILTER, SERVICE_ENDPOINT.UPDATE);

        let data = {
            id: filter.id,
            userId: user.id,
            entityName: _domain,
            isDefault: filter.isDefault,
            name: filter.name,
            definition: JSON.stringify(filter.definition)
        } as TableCustomFilter;

        let response = await serviceLocator.callService({ service, data } as ApiRequest);

        if (response.success) {
            let activeFilterId = activeFilter?.id == filter.id ? activeFilter?.id : undefined;
            refreshCustomFilters({ id: activeFilterId } as TableCustomFilter, !!activeFilterId);
        }
        
        return response.data;
    }, [domain]);

    const removeFilter = useCallback(async (filter: TableCustomFilter): Promise<void> => {

        let _domain = domain?.agGridDomain ?? '';
        let service = buildPath(_domain, TABLE_API_KEYS.TABLE_CUSTOM_FILTER, SERVICE_ENDPOINT.DELETE);

        let data = {
            id: filter.id
        } as TableCustomFilter;

        let response = await serviceLocator.callService({ service, data } as ApiRequest);

        if (response.success) {
            let activeFilterId = activeFilter?.id == filter.id ? undefined : activeFilter?.id;
            refreshCustomFilters({ id: activeFilterId } as TableCustomFilter, !activeFilterId);
        }

        return response.data;
    }, [domain]);

    const setFilterDetails = useCallback((filter?: TableCustomFilter) => {
        let _domain = domain?.agGridDomain ?? '';
        TableHelper.saveCurrentTableFilterDetails(_domain, filter);
    }, [domain]);

    const resetActiveFilter = useCallback(() => {
        let _defaultFilter = {
            id: -1,
            name: undefined,
            isDefault: false,
            _isTemporary: true,
            definition: {}
        } as TableCustomFilter;

        setActiveFilter(_defaultFilter);
        setFilterDetails(_defaultFilter);
        gridApi?.setFilterModel({});

    }, [gridApi]);

    const fetchCustomFilters = useCallback(async () => {

        let _domain = domain?.agGridDomain ?? '';
        let service = buildPath(_domain, TABLE_API_KEYS.TABLE_CUSTOM_FILTER, SERVICE_ENDPOINT.LIST);

        let data = {
            filter: {
                userId: {
                    filterType: 'number',
                    type: AG_GRID_FILTER_TYPE.EQUALS,
                    filter: user.id
                },
                entityName: {
                    filterType: 'text',
                    type: AG_GRID_FILTER_TYPE.EQUALS,
                    filter: _domain
                }
            } as FilterModel,
        };

        let response = await serviceLocator.callService({ service, data } as ApiRequest);
        if (response.success) {
            let filters = (response.data?.items ?? []) as TableCustomFilter[];
            filters = filters.map(f => ({ ...f, definition: JSON.parse(f.definition) }));
            setCustomFilters(filters);
        }

    }, [serviceLocator, domain, user]);

    const refreshCustomFilters = useCallback(async (activeFilter?: TableCustomFilter, forceActiveFilterReset: boolean = true) => {
        
        if (forceActiveFilterReset) 
            resetActiveFilter();

        await fetchCustomFilters();

        if (forceActiveFilterReset && activeFilter)
            setPendingActivationFilter(activeFilter);

    }, [resetActiveFilter, fetchCustomFilters]);

    const initCustomFilters = useCallback(async () => {

        if (!domain?.agGridDomain) return;

        let _activeFilter = getFromSession(buildPath(domain.agGridDomain, AG_GRID_STORAGE_KEYS.COLUMN_FILTER_DETAILS));
        let definition = getFromSession(buildPath(domain.agGridDomain, AG_GRID_STORAGE_KEYS.COLUMN_FILTER_PREFERENCES));
        if(!_activeFilter) {
            resetActiveFilter();
        }

        await fetchCustomFilters();

        if (_activeFilter)
            setPendingActivationFilter({ ..._activeFilter, definition: definition});

    }, [domain, fetchCustomFilters]);



    useEffect(() => {
        initCustomFilters();
    }, []);

    useEffect(() => {

        if(!pendingActivationFilter) return;

        activateFilter(pendingActivationFilter);
        setPendingActivationFilter(undefined);

    }, [pendingActivationFilter]);

    return {
        serviceLocator,
        cols,
        activeFilter,
        customFilters,
        updateDefaultFilter,
        applyFilter,
        isFilterApplied,
        existFilter,
        addFilter,
        updateFilter,
        removeFilter,
        refreshCustomFilters,
        resetActiveFilter
    } as TableCustomFilterHandler

}