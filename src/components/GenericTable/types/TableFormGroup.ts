import type { JSX, ReactElement } from "react";
import type { ComboboxDetail } from "../../../../types/system/ComboboxDetail";
import type { ComboboxOptionConfig } from "../../../../types/system/ComboboxOptionConfig";
import type { FilterModel } from "../../../../types/system/api/FilterModel";
import type { CheckboxConfig } from "../../../../types/system/CheckboxConfig";
import type { GenericButtonProps } from "../../GenericButton";

export type FormComponentType = "text" | "date" | "time" | "number" | "combobox" | "textarea" | "dragdrop" | "category" | "checkbox" | "currency" | "color" | "button" | "filler" | "info" | "externalComponent" | "progressBar" | "password" | "list";

export const FORM_COMPONENT_TYPE = {
    TEXT: 'text',
    DATE: 'date',
    TIME: 'time',
    NUMBER: 'number',
    COMBOBOX: 'combobox',
    TEXTAREA: 'textarea',
    DRAGDROP: 'dragdrop',
    CATEGORY: 'category',
    CHECKBOX: 'checkbox',
    CURRENCY: 'currency',
    COLOR: 'color',
    PASSWORD: 'password',
    PROGRESS_BAR: 'progressBar',

    //special components
    BUTTON: 'button', //componente per eseguire azioni all'interno del form - puà modificare i dati del form con callback
    FILLER: 'filler', //componente per riempire spazi nella riga
    INFO: 'info', //componente per descrivere una sezione
    LIST: 'list', //componente per elencare html contents
    EXTERNAL_COMPONENT: 'externalComponent' //componente iniettato esternamente - non influisce sul form
} 

export type TableFormGroup = {
    type: FormComponentType;
    colId: string;
    groupId?: string; //(TableGroup) gruppo di appartenenza - default nessun gruppo
    embeddedInColId?: string; //incapsula il TableForm in un altro TableFormGroup. embeddedInColId -> colId del campo su cui incapsulare il FormGroup  
    name: string; //translated
    placeholder?: string; //override del default placeholder
    hideLabel?: boolean; //nasconde l'etichetta associata al componente
    required: boolean;
    validation: Record<string, any>;
    disabled?: boolean;
    hide?: boolean;
    forceOnlyViewMode?: boolean;
    collapsable?: boolean; //TODO
    colSmSize?: number; //da 1 a 12
    colMdSize?: number; //da 1 a 12
    colLgSize?: number; //da 1 a 12
    colXsSize?: number; //da 1 a 12
    
    domain?: string; //(DOMINIO + SOTTODOMINIO) per componenti dinamici che richiedono chiamate a servizi (es. combobox)
    filterData?: FilterModel; //Pre filtra i dati che vengono fetchati dal server se indicato il domain
    isFilterSet?: boolean; //indica quando il filterData è popolato e pronto - utile per evitare chiamate server inutili

    //TODO: translationPath - il default dovrebbe essere <domain>.columns, senza ridondanza di domain
    translationPath?: string; //se il percorso delle traduzioni è diverso dal default <domain>.<domain>.columns
    
    //in readonly mode alcuni componenti vengono sovrascritti
    //da un componente ad hoc per evitare caricamenti backend inutili
    //es. COMBOBOX component
    readonlyFormGroup?: ReadonlyFormGroupConfig;

    //configurazione componente drag drop
    dragDropConfig?: DragDropConfig;

    //configurazione componente Combobox
    optionConfig?: ComboboxOptionConfig; 

    //configurazione componenti BUTTON
    buttonConfig?: ButtonConfig;

    //configurazione componenti ESTERNI
    //es. Comments
    externalConfig?: ExternalConfig;

    checkboxConfig?: CheckboxConfig;

    infoConfig?: InfoConfig;

    listConfig?: ListConfig;

    infoButtonConfig?: InfoButtonConfig; //aggiunge un bottone di info extra per descrivere il componente

    progressBarConfig?: ProgressBarConfig;

    dateConfig?: DateConfig;

    passwordConfig?: PasswordConfig;

}

export type InfoButtonConfig = { //aggiunge un bottone di info extra per descrivere il componente
    tooltip?: string;
    htmlContents?: JSX.Element[];
}

export type PasswordConfig = {
    showPwdButton: boolean; //default false - mostra l'azione per visualizzare la password immessa
}

export type DateConfig = {
    defaultValue?: Date; //valore di default della data - se non precisato resterà stringa vuota ("")
    overrideOnInit?: boolean; //sovrascrive il valore di default a ogni ingresso nel form - default false
}

export type TableGroupConfig = {
    name: string;
    order: number; //
}

export type ButtonConfig = {
    onClick: (data?: any) => void;
    icon?: ReactElement;
    variant?: string; //IdsVariant
    color?: string; //IdsColor
    borderColor?: string; //IdsColor - se non impostato eredita da color
    backgroundColor?: string; //IdsColor
    infoButtonConfig?: { //aggiunge il bottone di info al componente
        htmlContent: any[];
        tooltip: string;
    };
    shrink?: boolean; //versione contratta del bottone, il name diventa tooltip e viene mostrata solo l'icona - default false
}

export type ExternalConfig = {
    component: ReactElement;
}

export type DragDropConfig = {
    description?: string; //breve descrizione in cima alla sezione
    addFileDetailsText?: string; // es. 'I documenti possono essere aggiunti anche dopo la creazione della gara',
    maxSizePerFile?: number; // es. 50,
    supportedMediaTypes?: string[]; // es. ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'],
    loadingFileInfo?: string; // info per nuovi file - es. 'I file saranno caricati automaticamente quando salvi la gara',
    changingFileInfo?: string; // info per file esistenti - es. 'I file saranno modificati automaticamente quando salvi la gara'
}

export type ReadonlyFormGroupConfig = {
    hide?: boolean; //nasconde il campo in visualizzazione

    //a seguito di GET DTO (get specifica e completa)
    rootData?: string; //specifica l'oggetto da utilizzare per estrapolare i dati (es. data contiene una entity customer --> rootData: 'customer')
    readonlyColId?: string; //nome della colonna per la sola lettura, se diversa da col<Id> o col<Name>
    details: ComboboxDetail[]; //campi extra da mostrare in sola visualizzazione
    actions?: GenericButtonProps[]; //azioni in sola visualizzazione

    //senza GET DTO
    lightModeColId?: string; //colonna del DTO a disposizione (es. da una lista)
}

export type ProgressBarConfig = {
    color?: string;
}

export type InfoConfig = {
    title?: string;
    texts?: string[];
    htmlContents?: JSX.Element[];
    showAsPopup?: boolean; //default false
    overlayMode?: boolean; //apre la info in absolute position - default false
}

export type ListConfig = {
    icon?: any;
    title?: string;
    texts?: string[];
    htmlContents?: JSX.Element[];
    showAsPopup?: boolean; //default false
    overlayMode?: boolean; //apre la info in absolute position - default false
}