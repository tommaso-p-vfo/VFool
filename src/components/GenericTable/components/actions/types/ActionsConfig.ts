import { ReactNode } from "react";
import type { _TableActionType } from "./Action";
import type { _TableAction } from "./Action";

export type _TableActionsConfig<T = any> = {
    [actionName: string]: _TableActionConfig<T>
}

export type WrappedData<T> = {
    [K in keyof T]?: string;
};

export type _TableActionConfig<T> = {
    position: 'topBar-right' | 'topBar-left' | 'action-cell'; //posizione dell'azione nella griglia
    positionOrder: number; //se specificato indica l'ordine di inserimento, partendo da sinistra
    componentType: 'button' | 'switch';

    title?: string; //titolo da mostrare nell'header del modal associato all'azione - default inferito da dominio + tipo azione
    icon?: ReactNode; //React Icon
    color?: string; //CSS color - default primary
    
    enabled: boolean;

    actionType: _TableActionType|string; //tipo di azione - es. add, edit, delete, view, showComments, etc. - da usare per identificare l'icona di default da associare all'azione e per eventuali callback di default (es. delete)
    domain?: string; //se diverso da quello della tabella, permette di indirizzare l'azione verso un dominio specifico (es. per avere un'azione di add che invece di aprire il form di creazione del dominio della tabella, apra quello di un altro dominio - es. add protocollo invece di add tender)
    
    //TODO. verifica necessità
    // view?: GenericFormViewType; //permette di specificare una view per l'azione (es. edit mode o view mode) - default view mode
    
    // onClick?: (data?: T) => void; //old callback
    
    // modalVersion?: boolean;
    
    // gridApi?: any; //utile nelle callback di default che partono da componenti AG GRID
    // event?: (data?: T) => void;
    // aggiunge delle azioni diverse da quelle di default al componente quando 
    // l'azione 'principale' è configurata. 
    // Es. ActionsConfig.add: { customActions: { testConnection... } } action
    // aggiungo una customActions per avere
    // oltre alle azioni di default disponibili in fase di add
    // anche un'altra azione extra - es. Test Connection
    // questa azione sarà automaticamente disponibile nel form 
    // customActions?: _TableAction[];
    // defaultActions?: boolean; //default true - determina se includere le azioni di default della modal (es. Esci)

    //wrappedData
    //il componente prende di default i data del parent. Se però si volesse passare un oggetto diverso al componente, si può wrappare qui
    //la keyword _data permette di effettuare mappature tra valori del data parent e il wrapper. -> es. { customerId:"_data.id" }
    // wrappedData?: WrappedData<any>;


    params?: any //utile per il passaggio di oggetti dal parent al componente che gestirà l'azione - es. il ref di una modal da aprire all'esterno
}

export type ActionsMetadata<T = any> = {
    domain: string,
    tableName: string,
    actionsConfig: _TableActionsConfig<T>
}