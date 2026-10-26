// components/ActionsCellRenderer.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { type ICellRendererParams } from 'ag-grid-community';
import useTranslations from '../../../../../locales/hooks/useTranslations';
import GenericModal from '../../../modals/GenericModal';
import ACTIONS, { type ActionType } from '../../../../../core/constants/actions';
import { ComponentRegistry } from '../../../../../core/registry/ComponentRegistry';
import { toast } from 'react-toastify';
import type { Action } from './types/Action';
import { TableHelper } from '../../helpers/TableHelper';
import { AppPathHelper } from '../../../../../core/helpers/AppPathHelper';
import type { ActionsMetadata } from './types/ActionsMetadata';
import { AppHelper } from '../../../../../core/helpers/AppHelper';
import { FaEye, FaPen, FaRegComment, FaTrash } from 'react-icons/fa';
import GenericButton, { type GenericButtonConfig } from '../../../GenericButton';
import { IdsColor } from '../../../../../types/system/IdsColor';
import { IdsVariant } from '../../../../../types/system/IdsVariant';
import { GenericFormView, type GenericFormViewType } from '../../../../../types/system/GenericFormView';
import type { ActionConfig } from './types/ActionsConfig';
import { useTableContext } from '../../hooks/useTableContext';

interface ActionsCellRendererProps extends ICellRendererParams {
    metadata: any,
    data: any;
}

/**
 * 
 * @param props
 * - metadata: ActionsMetadata
 * - data: any //contiene il DTO
 * @returns 
 */
const ActionsCellRenderer: React.FC<ActionsCellRendererProps> = ({ metadata, data }: { metadata: ActionsMetadata, data: any }) => {

    const dataRef = useRef<any>(data);

    const t = useTranslations();

    const tableContext = useTableContext();

    const [domain, setDomain] = useState<string>(null);
    const [params, setParams] = useState<any>(null); //extra params per il componente - contenuti nelle actionsConfig in ActionsMetadata

    const somethingChangedRef = useRef<boolean>(false);
    
    //modal
    const genericModalRef = useRef<any>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [modalName, setModalName] = useState<string>('');
    const [modalSize, setModalSize] = useState<'xs'|'md'|'lg'|'xl'>('lg');
    //lista di azioni da rendere disponibili nella modal
    const [actions, setActions] = useState<Action[]>([]);
    //readonly per l'intero form legato alle azioni (visualizzazione, modifica, ecc.)
    const [readOnly, setReadOnly] = useState<boolean>(false);
    //componente dinamico della modal - start
    const [Component, setComponent] = useState<any>(null);
    const componentRef = useRef(null);
    //componente dinamico della modal - end

    const [view, setView] = useState<GenericFormViewType>(null);

    useEffect(() => {
        dataRef.current = data;
    }, [data]);

    useEffect(() => {  
        setDomain(metadata?.domain);
    }, [metadata]);

    const onEditFormSubmit = useCallback(async () => {
        somethingChangedRef.current = false;
        if (componentRef.current) {

            let success = false;
            let response = await componentRef.current.edit();

            if (AppHelper.isBoolean(response)) {
                success = response;
            } else {
                success = response.apiResponse.success;
            }

            if (success) {

                //callback after edit
                let action = _getActionConfig(ACTIONS.EDIT);
                if (action && action.enabled && action.callback) {
                    await action.callback(response.apiResponse.data, response.metadata);
                }

                toast.success(`${metadata.tableName} aggiornato correttamente!`);
                
                somethingChangedRef.current = true;
                closeModal();
            }
            else
                toast.error('Aggiornamento non riuscito!');
        }
    }, [metadata]);

    const onDeleteFormSubmit = useCallback(async () => {

        somethingChangedRef.current = false;
        if (componentRef.current) {

            let success = false;
            let response = await componentRef.current.delete();

            if (AppHelper.isBoolean(response)) {
                success = response;
            } else {
                success = response.apiResponse.success;
            }

            if (success) {

                //callback after delete
                let action = _getActionConfig(ACTIONS.DELETE);
                if (action && action.enabled && action.callback) {
                    await action.callback(response.apiResponse.data);
                }

                toast.success(`${metadata.tableName} rimosso correttamente!`);
                
                somethingChangedRef.current = true;
                closeModal();
            }
            else
                toast.error('Cancellazione non riuscita!');
        }
    }, [metadata]);
    
    const closeModal = useCallback(() => {
        setReadOnly(false);
        setOpenModal(false);

        if (somethingChangedRef.current && tableContext) {
            TableHelper.refreshAgGrid(tableContext.gridApi);
        }
        
    }, []);

    const _getActionConfig = useCallback((name: string) => {
        let action = metadata?.actionsConfig?.[name] ?? null;

        if(action && action.modalVersion === undefined) {
            action.modalVersion = true;
        }

        return action;
    }, [metadata]);

    const handleAction = useCallback((actionConfig: ActionConfig<any>, data: any) => {

        //handle wrapped data
        // let _data = data;
        // // if(actionConfig.wrappedData) {
        // //     _data = _applyWrappedData(actionConfig?.wrappedData);
        // // }
        // dataRef.current = _data;

        let preventDefault = false;
        
        if (actionConfig && actionConfig.enabled) {
            if (actionConfig.callback && !actionConfig.modalVersion) {
                preventDefault = true;
            }
        }
        
        setView(actionConfig.view ?? GenericFormView.READONLY_LIGHT);
        setDomain(actionConfig.domain ?? metadata?.domain);
        setParams(actionConfig.params ?? null);

        if (preventDefault) {
            actionConfig.callback(data);
        } else {
            // Comportamento standard (apertura modal)
            let path = AppPathHelper.build(actionConfig?.domain, actionConfig.actionType ?? ACTIONS.VIEW);
            let component = ComponentRegistry[path];
            setComponent(component);
            setModalName(`${actionConfig.title}`);
            setModalSize('lg');

            let defaultActions = [
                {
                    name: t.common.buttons.close,
                    onClick: closeModal
                }
            ] as Action[];

            if (actionConfig?.defaultActions !== undefined && !actionConfig?.defaultActions) {
                //elimina le default actions
                defaultActions = [];
            }

            defaultActions.unshift(...actionConfig?.customActions ?? [] as Action[]);

            setActions(defaultActions);
            setReadOnly(true);
            setOpenModal(true);
        }
    }, [metadata]);

    const handleView = useCallback(() => {
        let preventDefault = false;
        let actionConfig = _getActionConfig(ACTIONS.VIEW);
        if (actionConfig && actionConfig.enabled) {
            if (actionConfig.callback && !actionConfig.modalVersion) {
                preventDefault = true;  
            }
        }

        setParams(actionConfig.params ?? null);
        setView(actionConfig.view ?? GenericFormView.READONLY_FULL);

        if (preventDefault) {
            actionConfig.callback(dataRef.current);
        } else {
            // Comportamento standard (apertura modal)
            let showPath = AppPathHelper.build(actionConfig?.domain ?? metadata?.domain, ACTIONS.VIEW);
            let showComponent = ComponentRegistry[showPath];
            setComponent(showComponent);
            setModalName(`Visualizza ${metadata.tableName}`);
            setModalSize('lg');

            let defaultActions = [
                {
                    name: t.common.buttons.close,
                    onClick: closeModal
                }
            ] as Action[];

            defaultActions.unshift(...actionConfig?.customActions ?? [] as Action[]);

            setActions(defaultActions);
            setReadOnly(true);
            setOpenModal(true);
        }
    }, [metadata]);

    const handleEdit = useCallback(() => {

        let preventDefault = false;
        
        let actionConfig = _getActionConfig(ACTIONS.EDIT);
        if (actionConfig && actionConfig.enabled) {
            if (actionConfig.callback && !actionConfig.modalVersion) {
                preventDefault = true;
            }
        } 

        setView(actionConfig.view ?? GenericFormView.EDIT_FULL);
        setParams(actionConfig.params ?? null);

        if (preventDefault) {
            actionConfig.callback(data);
        } else {
            let editPath = AppPathHelper.build(actionConfig?.domain ?? metadata?.domain, ACTIONS.EDIT);
            let editComponent = ComponentRegistry[editPath];
            setComponent(editComponent);
            setModalName(`Modifica ${metadata.tableName}`);
            setModalSize('lg');

            let defaultActions = [
                {
                    name: t.common.buttons.editAndClose,
                    onClick: onEditFormSubmit
                }
            ] as Action[];

            defaultActions.unshift(...actionConfig?.customActions ?? [] as Action[]);

            setActions(defaultActions);
            setReadOnly(false);
            setOpenModal(true);
        }
    }, [metadata]);

    const handleDelete = useCallback(() => {

        let actionConfig = _getActionConfig(ACTIONS.DELETE);
        setView(actionConfig.view ?? GenericFormView.READONLY_LIGHT);
        setParams(actionConfig.params ?? null);

        let preventDefault = false;
        if (actionConfig && actionConfig.enabled) {
            if (actionConfig.callback && !actionConfig.modalVersion) {
                preventDefault = true;
            }
        } 

        if (preventDefault) {
            actionConfig.callback(dataRef.current);
        } else {
            let showPath = AppPathHelper.build(actionConfig?.domain ?? metadata?.domain, ACTIONS.VIEW);
            let showComponent = ComponentRegistry[showPath];
            setComponent(showComponent);
            setModalName(`Rimuovi ${metadata.tableName}`);
            setModalSize('lg');
            let defaultActions = [
                {
                    name: t.common.actions.delete,
                    onClick: onDeleteFormSubmit
                },
                {
                    name: t.common.buttons.cancel,
                    onClick: closeModal
                }
            ] as Action[];

            defaultActions.unshift(...actionConfig?.customActions ?? [] as Action[]);

            setActions(defaultActions);
            setReadOnly(true);
            setOpenModal(true);
        }
    }, [metadata]);

    const handleShowComments = useCallback(() => {

        let preventDefault = false;
        let action = _getActionConfig(ACTIONS.SHOW_COMMENTS);
        setDomain(action?.domain ?? metadata?.domain);

        if (action && action.enabled) {
            if (action.callback && !action.modalVersion) {
                preventDefault = true;
            }
        }

        setParams(action?.params ?? null);

        if (preventDefault) {
            action?.callback(dataRef.current);
        } else {
            let showPath = AppPathHelper.build(action?.domain ?? metadata?.domain, ACTIONS.SHOW_COMMENTS);
            let showComponent = ComponentRegistry[showPath];
            setComponent(showComponent);
            setModalName(`Commenti `);
            setModalSize('lg');
            setActions([]);
            setReadOnly(true);
            setOpenModal(true);
        }
    }, [metadata]);

    return (
        <>
         { openModal &&       
                <GenericModal
                    ref={genericModalRef}
                    title={modalName} 
                    size={modalSize}
                    shouldOpenModal={openModal}
                    onCloseModal={closeModal}
                    actions= {actions}
                    childrenRef={componentRef}
                >

                    {Component &&
                        <Component ref={componentRef} data={dataRef.current} view={view} domain={domain} params={params} parentRef={genericModalRef} />
                    }

                    {!Component &&
                        <div>Componente non disponibile</div>
                    }

                </GenericModal>
        }
        <div
         className="ids-actions d-flex align-items-center justify-content-center" 
        //  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >

            {
                metadata.actionsConfig && dataRef.current &&
                Object.entries(metadata.actionsConfig)
                    .filter(([actionKey]) => {
                        // Converti la stringa nel tipo ACTIONS per il confronto
                        const action = actionKey as ActionType;
                        return ![
                            ACTIONS.ADD,
                            ACTIONS.EXPORT,
                            ACTIONS.DELETE,
                            ACTIONS.EDIT,
                            ACTIONS.VIEW,
                            ACTIONS.SHOW_ATTACHMENTS,
                            ACTIONS.SHOW_COMMENTS
                        ].includes(action);
                    })
                .map(([actionKey, actionConfig]) => (

                    
                    <GenericButton
                        key={actionKey}
                        buttonConfig={{
                            variant: IdsVariant.LIGHT,
                            color: actionConfig.iconColor ?? IdsColor.PRIMARY,
                            icon: actionConfig.icon,
                        } as GenericButtonConfig}

                        tooltip={actionConfig?.title}
                        className="ids-btn"
                        onClick={() => {
                            handleAction(actionConfig, dataRef.current);
                        }}
                    />   
                ))
            }

            {metadata.actionsConfig?.[ACTIONS.VIEW]?.enabled && dataRef.current && (
                // <TooltipComponent title={t.common.actions.show}>
                    <GenericButton
                        buttonConfig={{
                            variant: IdsVariant.LIGHT,
                            color: IdsColor.LIGHT_BLUE,
                            icon: <FaEye size={15}/>
                        } as GenericButtonConfig}
                        tooltip={t.common.actions.show}
                        className="ids-btn"
                        onClick={handleView}
                        >
                        
                    </GenericButton>
                // </TooltipComponent>
               
            )}

            {metadata.actionsConfig?.[ACTIONS.EDIT]?.enabled && dataRef.current &&(
                // <TooltipComponent title={t.common.actions.edit}>
                    <GenericButton
                        buttonConfig={{
                            variant: IdsVariant.LIGHT,
                            color: IdsColor.YELLOW,
                            icon: <FaPen size={15} />
                        } as GenericButtonConfig}

                        tooltip={t.common.actions.edit}
                        className="ids-btn"
                        onClick={handleEdit}
                    >
                        
                    </GenericButton>
                // </TooltipComponent>
            )}

            {dataRef.current && metadata.actionsConfig?.[ACTIONS.SHOW_COMMENTS]?.enabled && (
                // <TooltipComponent title={t.common.actions.comments}>
                <GenericButton
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.GRAY,
                        icon: <FaRegComment size={15} />
                    } as GenericButtonConfig}
                    
                    tooltip={t.common.actions.show + ' Commenti'}
                    className=""
                    onClick={handleShowComments}
                >

                </GenericButton>
                // </TooltipComponent>
            )}

            {metadata.actionsConfig?.[ACTIONS.DELETE]?.enabled && dataRef.current && (
                // <TooltipComponent title={t.common.actions.delete}>
                    <GenericButton
                        buttonConfig={{
                            variant: IdsVariant.LIGHT,
                            color: IdsColor.RED,
                            icon: <FaTrash size={15} />
                        } as GenericButtonConfig}

                        tooltip={t.common.actions.delete}
                        className=""
                        onClick={handleDelete}
                    >
                        
                    </GenericButton>
                // </TooltipComponent>
            )}
        </div>
        </>

    );
    
};
export default ActionsCellRenderer;