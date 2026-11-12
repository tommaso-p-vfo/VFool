//TODO user is not defined - deve arrivare da auth. Il filtro non dovrebbe sapere nulla della chiamata, dovrebbe solo passare la definition

import { useCallback, useEffect, useMemo, useState } from "react";

import type { ColDef, FilterModel, GridApi } from "ag-grid-community";

import { type TableUserFilter } from "../../../types/TableUserFilter";

import { TABLE_STORAGE_KEYS } from "../../../constants/tableStorageConstants";
import { getFromSession } from "../../../../../utils/StorageHelper";

import { SERVICE_ENDPOINT } from "../../../../../types/api/ApiEndpoints";
import { TABLE_API_KEYS } from "../../../constants/tableApiConstants";
import { buildPath } from "../../../../../utils/Path";

import type { AgGridDomainType } from "../../../contexts/TableContext";
import { IServiceLocator } from "../../../../../types/api/IServiceLocator";
import { ApiRequest } from "../../../../../types/api/ApiRequest";
import { TableHelper } from "../../../helpers/TableHelper";
import { TABLE_FILTER_TYPE } from "../../../constants/tableConstants";
import { isEmptyObject } from "../../../../../utils/Guards";
import { QuickSearchConfig, TableFilterConfig } from "../../../types/TableAttributes";

export type QuickSearchInternalHandler = {
    config?: QuickSearchConfig;
    text ?: string;
    filter ?: FilterModel;
    reset: () => void;
    setFilter: (filter?: FilterModel) => void;
};

export type TableFilterInternalHandler = {
    // serviceLocator: IServiceLocator;
    // cols: ColDef[];

    filterConfig: {
        baseFilter?: FilterModel, 
        enableSavedFilters?: boolean; 
    };

    userFilter: TableUserFilter|undefined;
    
    applyFilter: (filterId: number) => Promise<void>;
    isFilterApplied: (filter: TableUserFilter) => boolean;
    existFilter: (filterId: number) => boolean;
    addFilter: (filter: TableUserFilter) => Promise<TableUserFilter>;
    updateFilter: (filter: TableUserFilter) => Promise<void>;
    removeFilter: (filter: TableUserFilter) => Promise<void>;

    // updateDefaultFilter: (filterId: number) => Promise<void>;
    buildTableUserFilter: (filter: FilterModel, currentUserFilter?: TableUserFilter) => TableUserFilter;
    resetUserFilter: () => void;
    savedFilters: TableUserFilter[];
    refreshSavedFilters: () => void;

    quickSearchHandler: QuickSearchInternalHandler;
    
}

export const useCustomFilterLogic = ({ 
    filterConfig,
    serviceLocator, 
    domain, 
    gridApi,
    userFilter, 
    setUserFilter 
}: { 
    filterConfig?: TableFilterConfig;
    serviceLocator: IServiceLocator, 
    domain: AgGridDomainType | undefined, 
    gridApi: GridApi | null, 
    userFilter: TableUserFilter | undefined, 
    setUserFilter: (filter?: TableUserFilter) => void 
}) => {

    //TODO. user definition
    // const auth = useAuth();
    // const user = auth.user;
    const user = {}
    
    const [pendingActivationFilter, setPendingActivationFilter] = useState<TableUserFilter | undefined>();
    const [savedFilters, setSavedFilters] = useState<TableUserFilter[]>([]);

    const enableSavedFilters = useMemo(() => {
        return filterConfig?.enableSavedFilters ?? false;
    }, [filterConfig?.enableSavedFilters]);

    const cols = useMemo(() => 
        gridApi?.getColumnDefs()?.filter(c => !c?.colId?.startsWith('_')
    ), [gridApi]);

    const [quickSearchFilter, setQuickSearchFilter] = useState<FilterModel>(); //filtro che viene applicato a prescindere dalle interazioni utente: es. filtro 'solo mie'
    const resetQuickSearch = () => { setQuickSearchFilter(undefined); };
    const quickSearchHandler = useMemo<QuickSearchInternalHandler>(() => {
        
        let quickSearchFilterText = '';
        if(!isEmptyObject(quickSearchFilter)) {
            quickSearchFilterText = Object.entries(quickSearchFilter)[0][1].filter;
        }
        
        return {
            config: filterConfig?.quickSearch,
            text: quickSearchFilterText,
            filter: quickSearchFilter,
            reset: resetQuickSearch,
            setFilter: setQuickSearchFilter
        }
    }, [quickSearchFilter, filterConfig?.quickSearch]);

    const isFilterApplied = useCallback((filter: TableUserFilter): boolean => {
        return userFilter?.id === filter.id;
    }, [userFilter]);

    const existFilter = (filterId: number): boolean => {
        return !!savedFilters?.find(f => f.id === filterId);
    }

    const applyFilter = async (filterId: number): Promise<void> => {

        let filterToApply = savedFilters?.find(f => f.id === filterId);
        gridApi?.setFilterModel(filterToApply?.definition);
        activateFilter(filterToApply);

        //Pulisci lista dei filtri temporanei se presenti
    }

    const activateFilter = useCallback((filter?: TableUserFilter) => {

        if (!savedFilters) return;

        if (filter && (filter._isTemporary || filter._isModified || filter?._isNew)) {
            setUserFilter(filter);
            setFilterDetails(filter);
            gridApi?.setFilterModel(filter.definition ?? {});
            return;
        }

        if (filter && filter.id > 0) {
            let savedFilter = savedFilters.filter(f => f.id == filter.id);
            if (savedFilter.length > 0) {
                setUserFilter(savedFilter[0]);
                setFilterDetails(savedFilter[0]);
                gridApi?.setFilterModel(savedFilter[0].definition);
                return;
            }
        }

        if(filter && filter.id === -1 && filter._isCandidateForNew) {
            //filtro tmp in sessione e non ancora salvato
            setUserFilter(filter);
            setFilterDetails(filter);
            gridApi?.setFilterModel(filter.definition);
            return;
        }

        let defaultFilters = savedFilters.filter(f => f.isDefault);

        if (defaultFilters && defaultFilters.length > 0) {

            //applico il preferito

            setUserFilter(defaultFilters[0]);
            setFilterDetails(defaultFilters[0]);
            gridApi?.setFilterModel(defaultFilters[0].definition);
        }
        else {

            //retituisco un filtro da sessione o vuotp

            let currentFilter = TableHelper.getCurrentTableFilter(domain?.agGridDomain);
            let currentFilterDetails = TableHelper.getCurrentTableFilterDetails(domain?.agGridDomain);
            if (currentFilter && currentFilterDetails.id) {
                setUserFilter({
                    id: currentFilterDetails.id,
                    name: currentFilterDetails.name,
                    isDefault: currentFilterDetails.isDefault ?? false,
                    _isTemporary: currentFilterDetails._isTemporary ?? true,
                    _isCandidateForNew: currentFilterDetails._isCandidateForNew ?? false,
                    _isModified: currentFilterDetails._isModified ?? false,
                    definition: currentFilter
                } as TableUserFilter);
                setFilterDetails(currentFilterDetails);
                gridApi?.setFilterModel(currentFilter);
            }
            else
                resetUserFilter();

        }
    }, [savedFilters]);

    const addFilter = useCallback(async (filter: TableUserFilter): Promise<TableUserFilter> => {

        let _domain = domain?.agGridDomain ?? '';
        let service = buildPath(_domain, TABLE_API_KEYS.TABLE_SAVED_FILTER, SERVICE_ENDPOINT.SAVE);
        
        let data = {
            userId: user.id,
            entityName: _domain,
            isDefault: false, //filter.isDefault,
            name: filter.name,
            definition: JSON.stringify(filter.definition)
        } as TableUserFilter;

        let response = await serviceLocator.callService({ service, data } as ApiRequest);
        
        if(response.success){
            refreshSavedFilters({ id: response.data } as TableUserFilter);
        }

        return response.data;
    }, [serviceLocator, domain]);

    const updateFilter = useCallback(async (filter: TableUserFilter): Promise<void> => {

        //ricarica i custom filters
        //aggiorna il filtro attivo se è quello modificato

        let _domain = domain?.agGridDomain ?? '';
        let service = buildPath(_domain, TABLE_API_KEYS.TABLE_SAVED_FILTER, SERVICE_ENDPOINT.UPDATE);

        let data = {
            id: filter.id,
            userId: user.id,
            entityName: _domain,
            isDefault: filter.isDefault,
            name: filter.name,
            definition: JSON.stringify(filter.definition)
        } as TableUserFilter;

        let response = await serviceLocator.callService({ service, data } as ApiRequest);

        if (response.success) {
            let activeFilterId = userFilter?.id == filter.id ? userFilter?.id : undefined;
            refreshSavedFilters({ id: activeFilterId } as TableUserFilter, !!activeFilterId);
        }
        
        return response.data;
    }, [domain]);

    const removeFilter = useCallback(async (filter: TableUserFilter): Promise<void> => {

        let _domain = domain?.agGridDomain ?? '';
        let service = buildPath(_domain, TABLE_API_KEYS.TABLE_SAVED_FILTER, SERVICE_ENDPOINT.DELETE);

        let data = {
            id: filter.id
        } as TableUserFilter;

        let response = await serviceLocator.callService({ service, data } as ApiRequest);

        if (response.success) {
            let activeFilterId = userFilter?.id == filter.id ? undefined : userFilter?.id;
            refreshSavedFilters({ id: activeFilterId } as TableUserFilter, !activeFilterId);
        }

        return response.data;
    }, [domain]);

    const setFilterDetails = useCallback((filter?: TableUserFilter) => {
        let _domain = domain?.agGridDomain ?? '';
        TableHelper.saveCurrentTableFilterDetails(_domain, filter);
    }, [domain]);

    const resetUserFilter = useCallback(() => {
        let _defaultFilter = {
            id: -1,
            name: undefined,
            isDefault: false,
            _isTemporary: true,
            definition: {}
        } as TableUserFilter;

        setUserFilter(_defaultFilter);
        setFilterDetails(_defaultFilter);
        gridApi?.setFilterModel({});

    }, [gridApi]);

    const buildTableUserFilter = (filter: FilterModel, currentUserFilter?: TableUserFilter) => {

        let isCurrentFilterSaved = currentUserFilter && currentUserFilter?.id > 0;

        let userFilter = {
            ...currentUserFilter,
            _isTemporary: true,
            _isCandidateForNew: !isCurrentFilterSaved && !isEmptyObject(filter),
            _isNew: false,
            _isModified: isCurrentFilterSaved ?? false,
            definition: filter
        } as TableUserFilter;

        // console.log('onChange ' + JSON.stringify(userFilter));
        return userFilter;

    }

    const fetchSavedFilters = useCallback(async () => {

        let _domain = domain?.agGridDomain ?? '';
        let service = buildPath(_domain, TABLE_API_KEYS.TABLE_SAVED_FILTER, SERVICE_ENDPOINT.LIST);

        let data = {
            filter: {
                userId: {
                    filterType: 'number',
                    type: TABLE_FILTER_TYPE.EQUALS,
                    filter: user.id
                },
                entityName: {
                    filterType: 'text',
                    type: TABLE_FILTER_TYPE.EQUALS,
                    filter: _domain
                }
            } as FilterModel,
        };

        let response = await serviceLocator.callService({ service, data } as ApiRequest);
        if (response.success) {
            let filters = (response.data?.items ?? []) as TableUserFilter[];
            filters = filters.map(f => ({ ...f, definition: JSON.parse(f.definition) }));
            setSavedFilters(filters);
        }

    }, [serviceLocator, domain, user]);

    const refreshSavedFilters = useCallback(async (activeFilter?: TableUserFilter, forceActiveFilterReset: boolean = true) => {
        
        if (forceActiveFilterReset) 
            resetUserFilter();

        await fetchSavedFilters();

        if (forceActiveFilterReset && activeFilter)
            setPendingActivationFilter(activeFilter);

    }, [resetUserFilter, fetchSavedFilters]);

    const initSavedFilters = useCallback(async () => {

        if (!filterConfig?.enableSavedFilters) return;
        if (!domain?.agGridDomain) return;

        let _activeFilter = getFromSession(buildPath(domain.agGridDomain, TABLE_STORAGE_KEYS.USER_FILTER_ADDITIONAL_DETAILS));
        let definition = getFromSession(buildPath(domain.agGridDomain, TABLE_STORAGE_KEYS.USER_FILTER));
        if(!_activeFilter) {
            resetUserFilter();
        }

        await fetchSavedFilters();

        if (_activeFilter)
            setPendingActivationFilter({ ..._activeFilter, definition: definition});

    }, [domain, fetchSavedFilters, enableSavedFilters]);

    useEffect(() => {
        initSavedFilters();
    }, []);

    useEffect(() => {

        if(!pendingActivationFilter) return;

        activateFilter(pendingActivationFilter);
        setPendingActivationFilter(undefined);

    }, [pendingActivationFilter]);

    return {
        filterConfig: { baseFilter: filterConfig?.baseFilter, enableSavedFilters },
        // cols,
        userFilter,
        savedFilters,
        applyFilter,
        isFilterApplied,
        existFilter,
        addFilter,
        updateFilter,
        removeFilter,
        refreshSavedFilters,
        resetUserFilter,
        buildTableUserFilter,
        quickSearchHandler
    } as TableFilterInternalHandler

}