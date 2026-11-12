import type {
    ColumnState
} from "ag-grid-community";


// import { StorageHelper } from "../../../../../../storage/helpers/StorageHelper";
// import STORAGE from "../../../../../../storage/constants/storage";
// import type { UserGridSetting } from "../../../../../../types/dto/UserGridSetting";
// import DOMAIN, { SUBDOMAIN } from "../../../../../../core/constants/domains";
// import { SERVICE_ENDPOINT } from "../../../../../../core/service-locator/constants/locatorPath";
// import type ApiRequest from "../../../../../../types/system/api/ApiRequest";
// import useAuth from "../../../../../../core/auth/hooks/useAuth";
// import { useAppContext } from "../../../../../../core/context/hooks/useAppContext";
// import { toast } from "react-toastify";
import { useCallback, useEffect, useMemo } from "react";
import { type AgGridDomainType } from "../../../contexts/TableContext";
import { buildPath } from "../../../../../utils/Path";
import { TableUserColumnSettings } from "../../../types/TableUserColumnSettings";
import { useTableContext } from "../../../hooks/useTableContext";
import { TABLE_STORAGE_KEYS } from "../../../constants/tableStorageConstants";
import { saveInLocalSession, saveInSession } from "../../../../../utils/StorageHelper";
import { ApiRequest } from "../../../../../types";
import { VFO_DOMAIN, VFO_SUBDOMAIN } from "../../../../../utils/ApiHelper";
import { SERVICE_ENDPOINT } from "../../../../../types/api/ApiEndpoints";

export type ColumnSettingsHandler = {
    saveColumnSettings: (columnState: ColumnState[], saveOnServer: boolean) => void;
    isModified: boolean;
    setIsModified: (mod: boolean) => void;
}

export const useColumnSettingsLogic = (
    userSettings: TableUserColumnSettings|undefined, 
    setUserSettings: (userSettings?: TableUserColumnSettings) => void
) => {

    const tableContext = useTableContext();
    const serviceLocator = tableContext.serviceLocator;
    const domain = tableContext.domain?.agGridDomain ?? '';

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

    useEffect(() => {

        if (!userSettings) return;

        saveInSession(buildPath(domain, TABLE_STORAGE_KEYS.USER_COLUMN_SETTINGS), userSettings);

    }, [domain, userSettings]);

    const saveColumnSettings = useCallback(async (columnState: ColumnState[], saveOnServer: boolean = false) => {

        let isNew = !userSettings || (userSettings.id <= 0 || userSettings.id === undefined); 
        
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

    return ({
        saveColumnSettings,
        isModified,
        setIsModified
    } as ColumnSettingsHandler);

}