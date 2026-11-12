import type {
    ColDef,
    ColumnState,
    GridApi
} from "ag-grid-community";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildPath } from "../../../../../utils/Path";
import { TableUserColumnSettings } from "../../../types/TableUserColumnSettings";
import { TABLE_STORAGE_KEYS } from "../../../constants/tableStorageConstants";
import { saveInLocalSession, saveInSession } from "../../../../../utils/StorageHelper";
import { ApiRequest, IServiceLocator } from "../../../../../types";
import { VFO_DOMAIN, VFO_SUBDOMAIN } from "../../../../../utils/ApiHelper";
import { SERVICE_ENDPOINT } from "../../../../../types/api/ApiEndpoints";
import { VfoColumnState } from "../ColumnSettings";

// export type TableInternalColumnSettingsHandler = {
//     saveColumnSettings: (columnState: ColumnState[], saveOnServer: boolean) => void;
//     isModified: boolean;
//     setIsModified: (mod: boolean) => void;

//     /** 
//      * colonne definite al caricamento della griglia
//      * indipendenti dal columnState corrente
//      * utile per reset
//      * */
//     defaultColumnDefinitions?: ColDef[]; //SOLA LETTURA
// }

export type TableColumnSettingsHandler = {

}

export type TableInternalColumnSettingsHandler = {
    columns: VfoColumnState[];
    setColumns: (cols?: VfoColumnState[]) => void;
    areAllSelected: boolean;
    isModified: boolean;

    loadCurrentColumnState: () => void; //popola columns
    selectAll: () => void;
    resetColumnSettings: () => void; 
    applyChanges: (saveOnServer?: boolean) => Promise<void>; //default false

}

export const useColumnSettingsLogic = (
    serviceLocator: IServiceLocator,
    domain: string,
    gridApi: GridApi | null,
    userSettings: TableUserColumnSettings|undefined, 
    setUserSettings: (userSettings?: TableUserColumnSettings) => void,
    defaultColumnDefinitions?: ColDef[]
) => {

    const isModified = useMemo(() => userSettings?._isModified ?? false, [userSettings]);
    const setIsModified = useCallback((mod: boolean) => {
        setUserSettings(prev => {
            if (!prev) return prev;
            const updated = { ...prev, _isModified: mod } as TableUserColumnSettings;
            
            saveInSession(
                buildPath(domain, TABLE_STORAGE_KEYS.USER_COLUMN_SETTINGS),
                updated
            );
            return updated;
        });
    }, [domain]);

    const [columns, _setColumns] = useState<VfoColumnState[]>([]);
    const setColumns = (cols?: VfoColumnState[]) => {
        _setColumns(cols ?? []);
        setIsModified(true);
    }
    const areAllSelected = useMemo(() => {
        let someHidden = columns.some((c) => c.hide);
        return !someHidden;
    }, [columns]);

        /**
     * Determina quali colonne mostrare in elenco
     * 
     * @param col 
     * @param hdsColDef 
     * @returns 
     */
    const _checkAddColumnState = useCallback((col: ColumnState | ColDef, hdsColDef?: any): boolean => {

        let _colId = "colId" in col ? col.colId : "field" in col ? col.field : "";

        if (_colId?.startsWith('_')) {
            // internal system columns - colonne aggiunte alla entity per system purposes
            // es. colonna delle azioni -> _actions
            // skip
            return false;
        }

        //TODO protected e system columns
        // let systemColumns = metadata.systemColumns;
        // if(systemColumns.includes(_colId)) {
        //     // system columns - presenti nella entity ma da non mostrare all'utente - utili solo per sistema
        //     // es. agentId per filtrare i preventivi utente (per agente associato all'utente)
        //     // skip
        //     return false;
        // }

        // let user = auth.user;
        // if (PermissionHelper.isAdmin(user))
        //     return true;

        // let protectedColumns = metadata?.protectedColumns;
        // if (protectedColumns.includes(_colId)) {
        //     // protectedColumns columns - presenti nella entity ma da non mostrare all'utente - utili solo per sistema
        //     // es. agentId per filtrare i preventivi utente (per agente associato all'utente)
        //     // skip
        //     return false;
        // }
        
        return true;

    }, []);

    const selectAll = () => {
        if (columns.filter((col) => { return !col.hide }).length === columns.length) 
            _setColumns(prev => prev.map(col => ({ ...col, hide: true })));
        else
            _setColumns(prev => prev.map(col => ({ ...col, hide: false })));

        setIsModified(true);
    };

    const _loadDefaultColumns = useCallback(() => {

        let columnStates = [] as VfoColumnState[];

        defaultColumnDefinitions?.forEach((col, index) => {

            if (!_checkAddColumnState(col, null)) {
                return;
            }

            const colState = {
                colId: col.field || col.colId || `col-${index}`,
                headerName: col.headerName || col.field || `Column ${index}`,
                hide: col.hide,
                order: index,
                width: col.width
            } as VfoColumnState;
            columnStates.push(colState);

        });

        let orderedDefColumnStates = columnStates?.sort((a, b) => a.order - b.order);
        setColumns(orderedDefColumnStates);

        return orderedDefColumnStates;

    }, [defaultColumnDefinitions]);

    const loadCurrentColumnState = useCallback(() => {

        if (!gridApi || !defaultColumnDefinitions) return;
    
        let columnStates = [] as VfoColumnState[];

        //hdsColDefsMap - struttura dati di sostegno per setting column state
        let hdsColDefsMap = new Map();
        defaultColumnDefinitions?.forEach((col, index) => {
            hdsColDefsMap.set(col.field,
                {
                    headerName: col.headerName || col.field || `Column ${index}`,
                    hide: col.hide
                });
        });

        gridApi?.getColumnState().forEach((col: ColumnState) => {
            let hdsColDef = hdsColDefsMap.get(col.colId);
            if (!_checkAddColumnState(col, hdsColDef))
            {
                return;
            }
            columnStates.push(col);
        });

        //set header names
        columnStates.forEach((col) => {
            col.headerName = hdsColDefsMap.get(col.colId)?.headerName ?? col.colId;
        });
        
        _setColumns(columnStates.sort((a, b) => a.order - b.order));
    }, [defaultColumnDefinitions, gridApi]);

    const resetColumnSettings = useCallback(() => {
        let defaultColumns = _loadDefaultColumns();
        setColumns(defaultColumns);
    }, [_loadDefaultColumns]);

    const _saveColumnSettings = useCallback(async (columnState: ColumnState[], saveOnServer: boolean = false) => {

        
        let isNew = !userSettings || (userSettings.id <= 0 || userSettings.id === undefined); 
        console.log('_saveColumnSettings ' + JSON.stringify(columnState) + ' - saveOnServer ' + saveOnServer + ' - userSettings: ' + JSON.stringify(userSettings));
        
        let _userSettings = {
            ...userSettings,
            id: isNew ? undefined : userSettings?.id,
            // userId: isNew ? auth.user?.id : userSettings?.userId,
            entityName: isNew ? domain : userSettings?.entityName,
            settings: columnState,
            _isModified: isNew ? isNew : isModified
        } as TableUserColumnSettings;
        setUserSettings(_userSettings);

        if (saveOnServer) { 
            let request = {
                service: buildPath(VFO_DOMAIN.USERS, VFO_SUBDOMAIN.USER_TABLE_COLUMN_SETTINGS, SERVICE_ENDPOINT.UPDATE),
                data: { ..._userSettings, settings: JSON.stringify(_userSettings.settings) } as TableUserColumnSettings
            } as ApiRequest;
            
            let response = await serviceLocator.callService(request);
            if(response.success) {

                //TODO callback per gestione notifica toast - Gestione try finally??
                // toast.success('Preferenze tabella salvate correttamente!');
                saveInLocalSession(buildPath(domain, TABLE_STORAGE_KEYS.USER_COLUMN_SETTINGS), _userSettings);
                setUserSettings(response.data);
                setIsModified(false);
            }

        }
    }, [userSettings, domain, isModified]);

    const applyChanges = useCallback(async (saveOnServer: boolean) => {

        console.log('applyChanges ' + JSON.stringify(columns) + ' - ga ' + JSON.stringify(gridApi));

        if (!gridApi) return;
        // Applica le modifiche alla griglia
        const columnState = columns.map((col) => ({
            colId: col.colId,
            headerName: col.headerName,
            hide: col.hide,
            sort: null,
            sortIndex: null,
            width: col.width
        }));

        gridApi.applyColumnState({
            state: columnState,
            applyOrder: true
        });

        await _saveColumnSettings(columnState, saveOnServer);

    }, [gridApi, _saveColumnSettings, columns]);

    useEffect(() => {

        if (!userSettings) return;

        saveInSession(buildPath(domain, TABLE_STORAGE_KEYS.USER_COLUMN_SETTINGS), userSettings);

    }, [domain, userSettings]);

    return ({
        columns,
        setColumns,
        areAllSelected,
        selectAll,
        resetColumnSettings,
        loadCurrentColumnState,
        applyChanges,
        isModified
    } as TableInternalColumnSettingsHandler);

}