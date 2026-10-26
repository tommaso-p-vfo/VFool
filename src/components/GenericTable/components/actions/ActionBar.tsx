
import useTranslations from "../../../../../locales/hooks/useTranslations";
import { useCallback, useEffect, useRef, useState } from "react";
import GenericModal from "../../../modals/GenericModal";
import { ComponentRegistry } from "../../../../../core/registry/ComponentRegistry";
import ACTIONS from "../../../../../core/constants/actions";
import { toast } from "react-toastify";
import type { GridApi } from "ag-grid-community";
import { TableHelper } from "../../helpers/TableHelper";
import { AppPathHelper } from "../../../../../core/helpers/AppPathHelper";
import type { ActionsMetadata } from "./types/ActionsMetadata";
import { AppHelper } from "../../../../../core/helpers/AppHelper";
import { FaCog, FaColumns, FaDownload, FaPlusCircle, FaRedo, FaSave } from "react-icons/fa";
import GenericButton, { type GenericButtonConfig } from "../../../GenericButton";
import { IdsColor } from "../../../../../types/system/IdsColor";
import { IdsVariant } from "../../../../../types/system/IdsVariant";
import { GenericFormView } from "../../../../../types/system/GenericFormView";
import type { Action } from "./types/Action";
import type { ActionBarConfig } from "../../types/TableMetadata";
import { Form, InputGroup } from "react-bootstrap";
import { useTableContext } from "../../hooks/useTableContext";
import { useAppContext } from "../../../../../core/context/hooks/useAppContext";
import type ApiRequest from "../../../../../types/system/api/ApiRequest";
import { SERVICE_ENDPOINT } from "../../../../../core/service-locator/constants/locatorPath";
import type { FilterModel } from "../../../../../types/system/api/FilterModel";

const ActionBar = ({ gridApiRef, metadata, actionBarConfig, openColumnChooser }: { gridApiRef: any, metadata: ActionsMetadata, actionBarConfig: ActionBarConfig, openColumnChooser: (open: boolean) => void }) => {

    const t = useTranslations();

    const tableContext = useTableContext();
    const serviceLocator = useAppContext().serviceLocator;

    const gridSettingsHandler = tableContext.gridSettingsHandler;

    const [domain, setDomain] = useState<string>(null);

    // mappa id azione -> stato checked
    const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});

    //open modal
    const [openAddModal, setOpenAddModal] = useState<boolean>(false);
    
    const [AddComponent, setAddComponent] = useState<any>(null);

    //lista di azioni da rendere disponibili nella modal
    const [actions, setActions] = useState<Action[]>([]);

    const addComponentRef = useRef(null);

    useEffect(() => {
        const actions = actionBarConfig?.actions;
        if (!actions) return;

        const initial: Record<string, boolean> = {};
        actions
            .filter(a => a.type === 'switch')
            .forEach(a => {
                // se vuoi riagganciare la session storage, qui è il punto giusto
                // if (StorageHelper.existInSession(AppPathHelper.build(domain, a.id))) {
                //     initial[a.id] = JSON.parse(StorageHelper.getFromSession(AppPathHelper.build(domain, a.id))).checked;
                // } else {
                //     initial[a.id] = a.defaultValue ?? false;
                // }
                initial[a.id] = a.defaultValue ?? false;
            });

        setCheckedMap(initial);
    }, [actionBarConfig]);

    useEffect(() => {
        setDomain(metadata?.domain);
    }, [metadata]);

    const _getActionConfig = useCallback((name: string) => {
        let action = metadata?.actionsConfig?.[name] ?? null;

        if (action && action.modalVersion === undefined) {
            action.modalVersion = true;
        }

        return action;
    }, [metadata]);


    const close = () => {
        setOpenAddModal(false)
    };

    const onAddFormSubmit = useCallback(async (closeOnSuccess?: boolean) => {
        
        if (addComponentRef.current) {

            let gridApi: GridApi = gridApiRef?.current;

            let success = false;
            let response = await addComponentRef.current.add();

            if (AppHelper.isBoolean(response)) {
                success = response;
            } else {
                success = response.apiResponse.success;
            }

            if (success) {

                //callback after add
                let action = _getActionConfig(ACTIONS.ADD);
                if (action && action.enabled && action.callback) {
                    await action.callback(response.apiResponse.data, response.metadata);
                }

                toast.success(`${metadata.tableName} aggiunto correttamente!`);
                if (closeOnSuccess) {
                    TableHelper.refreshAgGrid(gridApi);
                    close();
                }
            }
            else {
                toast.error('Inserimento non riuscito!');
            }
            
        }
    }, [metadata]);

    const handleAdd = useCallback(() => {

        let preventDefault = false;

        let actionConfig = _getActionConfig(ACTIONS.ADD);
        if (actionConfig && actionConfig.enabled) {
            if (actionConfig.callback && !actionConfig.modalVersion) {
                preventDefault = true;
            }
        } 

        if(preventDefault)
        {
            actionConfig?.callback ? actionConfig?.callback() : null;
        } else {

            let addPath = AppPathHelper.build(actionConfig?.domain ?? metadata?.domain, ACTIONS.ADD);
            let addComponent = ComponentRegistry[addPath];
            setAddComponent(addComponent);

            let defaultActions = [
                {
                    name: t.common.buttons.saveAndClose,
                    onClick: () => { onAddFormSubmit(true) }
                }
            ] as Action[];

            defaultActions.unshift(...actionConfig?.customActions ?? [] as Action[]);

            setActions(defaultActions);

            setOpenAddModal(true);
        }
    }, [metadata]);

    const handleExport = useCallback(async () => {

        let preventDefault = false;

        let actionConfig = _getActionConfig(ACTIONS.EXPORT);
        if (actionConfig && actionConfig.enabled) {
            if (actionConfig.callback && !actionConfig.modalVersion) {
                preventDefault = true;
            }
        }

        if (preventDefault) {
            actionConfig?.callback ? actionConfig?.callback() : null;
        } else {
            let preFilter = actionConfig?.params?.preFilter ?? {};
            let filterModel = tableContext.gridApi?.getFilterModel();

            let filter = {
                ...filterModel,
                ...preFilter
            } as FilterModel;

            let request = {
                service: AppPathHelper.build(domain, SERVICE_ENDPOINT.EXPORT),
                data: {
                    filter: filter ?? {} as FilterModel
                }
            } as ApiRequest;

            let response = await serviceLocator.callService(request);
            if (response.success) {
                let url = window.URL.createObjectURL(response.data);
                let link = document.createElement('a');
                link.href = url;
                link.download = 'Estrazione '.concat(AppPathHelper.getNestedProperty(t, AppPathHelper.build(domain, 'name'))).concat(' del ').concat(AppHelper.formatDate(new Date().toISOString(), true));
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        }
    }, [metadata, serviceLocator, domain]);

    const handleRefresh = () => {

        if(!gridApiRef.current) return;

        TableHelper.refreshAgGrid(gridApiRef.current);

    };

    return (

        <div className="ids-action-bar d-flex justify-content-between">

            {(openAddModal) && 
            
                <GenericModal
                    title={`Aggiungi ${metadata.tableName}`} 
                    shouldOpenModal={openAddModal}
                    onCloseModal={() => setOpenAddModal(false)}
                    actions= {actions}
                    childrenRef={addComponentRef} //espone i metodi del GenericForm - reso disponibile per l'accesso al metodo data() per ottenere i dati aggiornati all'esterno
                >

                    {AddComponent &&
                        <AddComponent ref={addComponentRef} view={GenericFormView.NEW} data={{}} domain={domain} />
                    }

                    {!AddComponent &&
                        <div>Componente non disponibile</div>
                    }

                </GenericModal>
            
            }


            <div className="d-flex ms-4 align-items-center justify-content-start gap-1">
                {actionBarConfig?.actions?.filter(a => a.type == 'switch').map((action, idx) => (

                    <div key={'sw-' + idx} className="d-flex align-items-center mb-3">
                        <Form.Check
                            key={`sw-${idx}`}
                            name={action.title}
                            title={action.title}
                            disabled={action.disabled ?? false}
                            type="switch"
                            id={`sw-${action.id ?? idx}`}
                            checked={checkedMap[action.id] ?? action.defaultValue ?? false}
                            onChange={(e) => {

                                const checked = e.target.checked;

                                // aggiorna lo state locale
                                setCheckedMap(prev => ({ ...prev, [action.id]: checked }));

                                const data = { checked };
                                action.onClick(data, gridApiRef.current, tableContext);
                            }}
                            className="me-1 cursor-pointer d-inline"
                        />
                        <span className="small">{action.title}</span>
                    </div>
                
                ))}
            </div>


            <div className="d-flex align-items-center justify-content-end">

                {actionBarConfig?.actions?.filter(a => a.type == 'button').map((action, idx) => (
                    <GenericButton
                        key={`btn-${idx}`}
                        onClick={action.onClick}
                        tooltip={action.title}
                        buttonConfig={{
                            variant: IdsVariant.LIGHT,
                            color: action.color,
                            icon: action.icon
                        } as GenericButtonConfig}
                        className="ids-table-top-bar-btn m-0"
                    />
                ))}
                
                <GenericButton
                    onClick={handleRefresh}
                    tooltip={t.common.actions.refresh}
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.PRIMARY,
                        icon: <FaRedo />
                    } as GenericButtonConfig}
                    className="ids-table-top-bar-btn m-0"
                />

            {metadata?.actionsConfig?.[ACTIONS.EXPORT]?.enabled &&
                <GenericButton
                    onClick={handleExport}
                    tooltip={t.common.actions.export}
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.PRIMARY,
                        icon: <FaDownload />
                    } as GenericButtonConfig}
                    className="ids-table-top-bar-btn"
                />
            }
            
            {metadata?.actionsConfig?.[ACTIONS.ADD]?.enabled &&
                <GenericButton
                    onClick={handleAdd}
                    tooltip={t.common.actions.add}
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.PRIMARY,
                        icon: <FaPlusCircle />
                    } as GenericButtonConfig}
                    className="ids-table-top-bar-btn"
                />
            }

            <InputGroup className="w-auto gap-0 m-0 p-0 ids-table-top-bar-btn ids-table-top-bar-inputgrp-btn">
                <GenericButton
                    tooltip="Gestione colonne"
                    onClick={openColumnChooser}
                    className="m-0"
                    buttonConfig={{
                        
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.PRIMARY,
                        backgroundColor: IdsColor.PRIMARY,
                        icon: <div style={{ position: 'relative', display: 'inline-block' }}>
                            <FaColumns />
                            <FaCog style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -4,
                                fontSize: '0.6em'
                            }} />
                        </div>
                    } as GenericButtonConfig}
                />

                <GenericButton
                    tooltip="Salva preferenze"
                    onClick={() => {
                        gridSettingsHandler.saveGridSettings(gridApiRef.current.getColumnState(), true);
                    }}
                    className="m-0 px-2 ids-no-border-left"
                    disabled={!gridSettingsHandler.isModified}
                    buttonConfig={{

                        variant: IdsVariant.LIGHT,
                        color: IdsColor.PRIMARY,
                        backgroundColor: IdsColor.PRIMARY,
                        icon: <FaSave size={12}/>
                        
                    } as GenericButtonConfig}
                />

            </InputGroup>

            </div>
            


        </div>

    );

};

export default ActionBar;