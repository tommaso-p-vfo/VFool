import type {
    ColumnState
} from "ag-grid-community";

import { AppPathHelper } from "../../../../../../core/helpers/AppPathHelper";
import { StorageHelper } from "../../../../../../storage/helpers/StorageHelper";
import STORAGE from "../../../../../../storage/constants/storage";
import type { UserGridSetting } from "../../../../../../types/dto/UserGridSetting";
import DOMAIN, { SUBDOMAIN } from "../../../../../../core/constants/domains";
import { SERVICE_ENDPOINT } from "../../../../../../core/service-locator/constants/locatorPath";
import type ApiRequest from "../../../../../../types/system/api/ApiRequest";
import useAuth from "../../../../../../core/auth/hooks/useAuth";
import { useAppContext } from "../../../../../../core/context/hooks/useAppContext";
import { toast } from "react-toastify";
import { useCallback, useEffect, useMemo } from "react";
import { type AgGridDomainType } from "../../../contexts/TableContext";

export type GridSettingsHandler = {
    saveGridSettings: (columnState: ColumnState[], saveOnServer: boolean) => void;
    isModified: boolean;
    setIsModified: (mod: boolean) => void;
}

export const useGridSettingsLogic = (domain: AgGridDomainType, gridSettings: UserGridSetting|undefined, setGridSettings: (gridSettings?: UserGridSetting) => void) => {

    const auth = useAuth();
    const appContext = useAppContext();
    const serviceLocator = appContext.serviceLocator;

    const isModified = useMemo(() => gridSettings?._isModified ?? false, [gridSettings]);

    const setIsModified = useCallback((mod: boolean) => {
        setGridSettings(prev => {
            if (!prev) return prev;
            const updated = { ...prev, _isModified: mod } as UserGridSetting;
            StorageHelper.saveInSession(
                AppPathHelper.build(domain.agGridDomain, STORAGE.COLUMN_PREFERENCES),
                updated
            );
            return updated;
        });
    }, [domain]);

    useEffect(() => {

        if (!gridSettings) return;

        StorageHelper.saveInSession(AppPathHelper.build(domain.agGridDomain, STORAGE.COLUMN_PREFERENCES), gridSettings);

    }, [domain, gridSettings]);

    const saveGridSettings = useCallback(async (columnState: ColumnState[], saveOnServer: boolean = false) => {

        let isNew = !gridSettings || (gridSettings.id <= 0 || gridSettings.id === undefined); 
        
        let _gridSettings = {
            ...gridSettings,
            id: isNew ? undefined : gridSettings?.id,
            userId: isNew ? auth.user?.id : gridSettings?.userId,
            entityName: isNew ? domain.agGridDomain : gridSettings?.entityName,
            settings: columnState,
            _isModified: isNew ? isNew : isModified
        } as UserGridSetting;
        setGridSettings(_gridSettings);

        if (saveOnServer) { 
            let request = {
                service: AppPathHelper.build(DOMAIN.USERS, SUBDOMAIN.USER_GRID_SETTINGS, SERVICE_ENDPOINT.UPDATE),
                data: { ..._gridSettings, settings: JSON.stringify(_gridSettings.settings) } as UserGridSetting
            } as ApiRequest;
            
            let response = await serviceLocator.callService(request);
            if(response.success) {
                toast.success('Preferenze tabella salvate correttamente!');
                StorageHelper.saveInLocalSession(AppPathHelper.build(domain.agGridDomain, STORAGE.COLUMN_PREFERENCES), _gridSettings);
                setGridSettings(response.data);
                setIsModified(false);
            }

        }
    }, [gridSettings, domain, isModified]);

    return ({
        saveGridSettings,
        isModified,
        setIsModified
    } as GridSettingsHandler);

}