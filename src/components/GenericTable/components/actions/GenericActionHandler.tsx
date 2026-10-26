// components/ActionsCellRenderer.tsx
import React, { act, forwardRef, use, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { type GridApi, type ICellRendererParams } from 'ag-grid-community';
import useTranslations from '../../../../../locales/hooks/useTranslations';
import GenericModal from '../../../modals/GenericModal';
import ACTIONS from '../../../../../core/constants/actions';
import { ComponentRegistry } from '../../../../../core/registry/ComponentRegistry';
import type { Action } from './types/Action';
import { TableHelper } from '../../helpers/TableHelper';
import { AppPathHelper } from '../../../../../core/helpers/AppPathHelper';
import type { ActionConfig, WrappedData } from './types/ActionsConfig';
import { TranslationHelper } from '../../../../../locales/helpers/TranslationHelper';
import type { GenericFormViewType } from '../../../../../types/system/GenericFormView';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import type { BulkItem } from '../../../../../types/system/BulkItem';
import { FunctionRegistry } from '../../../../../core/registry/FunctionRegistry';

export interface ActionHandlerComponentProps extends ICellRendererParams {
    domain: string;
    view?: GenericFormViewType;
    data: any;
}

export type GenericActionHandlerCallbacks = {
    handleAction: () => void;
    setActionConfig: (actionConfig: ActionConfig<any>) => void;
    setData: (data: any) => void;
};

/**
 * 
 * @param props
 * @returns 
 */
const GenericActionHandler: React.FC<any> = forwardRef((props, ref) => {

    //DATA INIT - start
    //action config e data devono essere passati da chi usa il componente, in modo da rendere il componente riutilizzabile in contesti diversi (es. tabella, drawer, etc.) e non legato ad un singolo dominio o azione
    //attraverso imperative handle - set action config e data da chi usa il componente, in modo da poterli aggiornare dinamicamente in base al contesto (es. azione edit su riga 1, azione view su riga 2, etc.)
    const actionConfigRef = useRef<ActionConfig<any> | null>(null);
    const dataRef = useRef<any>(null);

    const genericModalRef = useRef<any>(null);
    
    const setActionConfig = (actionConfig: ActionConfig<any>) => {
        actionConfigRef.current = actionConfig;
        setView(UiHelper.getViewFromActionType(actionConfig.actionType));
        setDomain(actionConfig.domain ?? '');
    }

    const setData = (data: any) => {
        dataRef.current = data;
    }

    //DATA - end

    const [view, setView] = useState<GenericFormViewType>(null);
    const [domain, setDomain] = useState<string>(null);
    const [params, setParams] = useState<any>(null); //extra params per il componente - contenuti nelle actionsConfig in ActionsMetadata

    const t = useTranslations();

    const somethingChangedRef = useRef<boolean>(false);

    //modal
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

    const closeModal = useCallback(() => {
        setReadOnly(false);
        setOpenModal(false);

        let actionConfig = actionConfigRef.current;
        if (actionConfig?.gridApi && genericModalRef.current?.hasChanged()) {
            TableHelper.refreshAgGrid(actionConfig.gridApi);
        }

    }, []);

    const tryGetTitle = useCallback((): string => {
        let actionConfig = actionConfigRef.current;
        let actionVerb = '';
        switch (actionConfig?.actionType) {
            case ACTIONS.ADD:
                actionVerb = t.common.actions.add;
                break;
            case ACTIONS.EDIT:
                actionVerb = t.common.actions.edit;
                break;
            case ACTIONS.DELETE:
                actionVerb = t.common.actions.delete;
                break;
            case ACTIONS.VIEW:
                actionVerb = t.common.actions.show;
                break;
            default:
                actionVerb = 'Gestisci';
                break;
        }
        return `${actionVerb} ${actionConfig?.domain ? TranslationHelper.getProperty(t, actionConfig?.domain)?.name : ''}`;

    }, [t]);

    const _toBulkItem = (prop: string, flag: 'new' | 'changed' | 'deleted', data: any) => {
        //TODO: da adeguare a AppHelper.toBulkItem - da deprecare in favore del metodo statico
        let value = data[prop];
        return {
            item: { value },
            isAdded: flag == 'new',
            isChanged: flag == 'changed',
            isDeleted: flag == 'deleted',
        } as BulkItem<any>;
    }

    const handleAction = useCallback(() => {

        let actionConfig = actionConfigRef.current;
        if (!actionConfig || !actionConfig?.enabled) return;

        //handle wrapped data
        let _data = dataRef.current;
        // if(actionConfig.wrappedData) {
        //     _data = _applyWrappedData(actionConfig?.wrappedData);
        // }
        dataRef.current = _data;

        setParams(actionConfig.params ?? null);

        let preventDefault = false;

        if (actionConfig && actionConfig.enabled) {
            if (actionConfig.callback && !actionConfig.modalVersion) {
                preventDefault = true;
            }
        }

        if (preventDefault) {
            actionConfig?.callback ? actionConfig.callback(dataRef.current) : null;
        } else {
            let actionPath = AppPathHelper.build(actionConfig?.domain, actionConfig?.actionType);
            let component = ComponentRegistry[actionPath];
            setComponent(component);
            setModalName(actionConfig?.title ?? tryGetTitle());
            setModalSize('lg');

            let defaultActions = [
                {
                    name: t.common.buttons.close,
                    onClick: closeModal
                }
            ] as Action[];

            defaultActions.unshift(...actionConfig?.customActions ?? [] as Action[]);

            setActions(defaultActions);
            setReadOnly(false);
            setOpenModal(true);
        }
    }, [ tryGetTitle]);

    useEffect(() => {

        if(!FunctionRegistry.has('_toBulkItem')) {
            FunctionRegistry.register('_toBulkItem', _toBulkItem);
        }

    }, []);

    useImperativeHandle<any, GenericActionHandlerCallbacks>(ref, () => ({
        handleAction,
        setActionConfig,
        setData
    }), [handleAction]);

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
        
        </>

    );
    
});
export default GenericActionHandler;