import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { useAppContext } from "../../../../../../core/context/hooks/useAppContext";
import { AppPathHelper } from "../../../../../../core/helpers/AppPathHelper";
import type { ComboboxOptionConfig } from "../../../../../../types/system/ComboboxOptionConfig";
import AsyncSelect from 'react-select/async';
import { Form } from "react-bootstrap";
import { type ComboboxDetail, ComboboxDetailFormatType } from "../../../../../../types/system/ComboboxDetail";
import { AppHelper } from "../../../../../../core/helpers/AppHelper";
import type { FilterModel } from "../../../../../../types/system/api/FilterModel";
import useTranslations from "../../../../../../locales/hooks/useTranslations";
import { AG_GRID_FILTER_TYPE } from "../../../../tables/constants/agGridConstants";
import GenericButton, { type GenericButtonConfig } from "../../../../GenericButton";
import { FaTimes, FaUndoAlt } from "react-icons/fa";
import { IdsColor } from "../../../../../../types/system/IdsColor";
import { IdsVariant } from "../../../../../../types/system/IdsVariant";
import { isBulkItem, type BulkItem } from "../../../../../../types/system/BulkItem";
import LoadingOverlay from "../../../../loading/GenericLoadingOverlay";
import { type ActionMeta } from 'react-select';
import { Square } from "lucide-react";
import { UiHelper } from "../../../../../../core/helpers/UiHelper";
import type { ReadonlyFormGroupConfig } from "../../../../tables/types/TableFormGroup";
import InfoButton from "../../../../InfoButton";
import { TranslationHelper } from "../../../../../../locales/helpers/TranslationHelper";

export interface TableComboboxOption {
    value: number;
    label: ReactElement | string;
    //aggiunge delle informazioni alle singole option
    additionalLabel?: ReactNode;
    raw?: any;
    hidden?: boolean;
}

/**
 * 
 * @param id - id univoco del componente del DOM
 * @param domain - nome del dominio (DOMINIO + SOTTODOMINIO)
 * @param disabled - abilita/disabilita la modifica della combobox
 * @param required - imposta il campo come obbligatorio
 * @param onChange - funzione di callback al cambiamento del valore selezionato
 * @param reset - number - contatore per la gestione del reset del componente - default 0
 *   
 * @returns 
 */
const TableCombobox = ({ id, domain, data, onChange, disabled, required, readonly, filterData, optionConfig, reset, selectedValue, readonlyFormGroup, translationPath, options }: 
    { id: string,
      domain: string,
      data: any;
      onChange: any, 
      disabled: boolean, 
      required: boolean,
      readonly?: boolean,
      filterData?: FilterModel, //pre-filtro sulle fetch dati server. es. filtro per customerCode
      optionConfig?: ComboboxOptionConfig,
      reset?: number,
      selectedValue?: any //pre valorizzazione,
      readonlyFormGroup?: ReadonlyFormGroupConfig,
      translationPath?: string; //se diverso da <dominio>.<dominio>.columns,
      options: any[] //REQUIRED - data server items
    }) => {

    const isInitialized = useRef(false);

    const t = useTranslations();

    const searchColFields = optionConfig?.searchColFields;
    const selectedValueConfig = optionConfig?.selectedValueConfig;
    const renderValueOnInput = optionConfig?.renderValueOnInput ?? true;

    const refreshCombo = optionConfig?.refresh ?? false;

    const context = useAppContext();
    const serviceLocator = context.serviceLocator;

    const [defaultOptions, setDefaultOptions] = useState<TableComboboxOption[] | BulkItem[] | undefined>(undefined);
    const optionsRef = useRef<TableComboboxOption[] | BulkItem[]>([]);
    const [currentOption, setCurrentOption] = useState<TableComboboxOption | BulkItem>({} as TableComboboxOption);
    const currentOptionRef = useRef(null);

    const [currentOptionList, setCurrentOptionList] = useState<BulkItem[]>([]);
    const currentOptionListRef = useRef<BulkItem[]>([]);
        
    const [searchFields, setSearchFields] = useState<string[]>(['name']);

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMissingOptions, setIsLoadingMissingOptions] = useState(false);

    const lastReset = useRef(reset ?? 0);

    const readonlyRootData = (disabled || readonly) ? readonlyFormGroup?.rootData ? data[readonlyFormGroup?.rootData] : data : data;

    /* VALIDAZIONE - START */
    const [isValid, setIsValid] = useState<boolean | null>(null);
    const controlRef = useRef<HTMLInputElement>(null);
    //TODO
    // useEffect(() => {
    //     if (controlRef.current) {
    //         const wasValid = isValid;
    //         const nowValid = controlRef.current.checkValidity();

    //         if (wasValid !== nowValid) {
    //             setIsValid(nowValid);
    //         }
    //     }
    // }, [currentOptionRef.current]); // dipendenze che influenzano la validità
    /* VALIDAZIONE - END */


    /**
     * garantisce che il prepopolamento del filtro avvenga prima della fetch dei dati
     * dipende da Generic Form
     */
    const isFilterDataInit = useCallback(() => {
 
        if(filterData === null) {
            //il filtro non è ancora stato aggiornato nel Generic Form
            return false;
        }
        
        //il filtro è aggiornato ma non è impostato - comportamento di default
        if (AppHelper.isEmptyObject(filterData)) return true;

        //il filtro è pronto, autorizziamo la fetch dati con il filtro settato
        let isFilterDataSet = true;
        const filterModel = filterData;

        Object.keys(filterModel).forEach(key => {
            if(filterModel[key].filter === undefined ) 
                isFilterDataSet = false;
        });

        return isFilterDataSet;
        
    }, [filterData]);

    useEffect(() => { 

        if(!options) return;

                let tmp = [] as any[]; //ComboboxOption[] | BulkItem[];
        
        let _data = options;
        let fields = _getOptionFields();

        _data.forEach((d: any) => {
            let label = <span>{fields.valueFields.map((field, idx) => (
                d[field] ? 
                    field.includes('color') ? 
                        <Square
                            key={idx}
                            size={30}
                            fill={UiHelper.getColor(d[field]).color}
                            stroke="none"
                            strokeWidth={1}
                        />
                    : d[field] + ' ' : ''
            ))}</span>;

            let item = {
                value: d[fields.keyField],
                label: label,
                additionalLabel: _renderAdditionalLabel(d),
                hidden: false,
                raw: d
            } as TableComboboxOption;

            if(optionConfig?.allowMultiSelection) {
                tmp.push(_convertInBulkItem(item, false, false, false));
            }
            else {
                tmp.push(item);
            }

        });
        
        //init
        optionsRef.current = tmp;
        setDefaultOptions(tmp);


    }, [options]);

    useEffect(() => {

        if (disabled || readonly) return;

        if (!selectedValue || !defaultOptions || isInitialized.current || !isFilterDataInit()) return;
        isInitialized.current = true; // ✅ Segna come inizializzato
        
        let fields = _getOptionFields();
        let filterModel = filterData ?? {} as FilterModel;
        let areOptionsMissing = false; //check download option mancanti nella fetch iniziale

        //pre inizializzazione
        if (optionConfig?.allowMultiSelection && Array.isArray(selectedValue)) {

            let optionsValueMap = defaultOptions.map(o => o.value);
            let missingValues = selectedValue.filter(svalue => !optionsValueMap.includes(svalue));
            //let selectedValues = defaultOptions.filter(o => selectedValue.includes(o.value)) ?? [] as ComboboxOption[];

            //setCurrentOptionList(selectedValues);
           // currentOptionListRef.current = _convertInBulkItems(selectedValues, true);

            if (missingValues.length == 0) {
                // setCurrentOption(defaultOptions[0]);
                // currentOptionRef.current = defaultOptions[0];
                return;
            }

            areOptionsMissing = true;

            filterModel = {
                ...filterModel,
                [fields.keyField]: {
                    filter: missingValues,
                    filterType: "number",
                    type: AG_GRID_FILTER_TYPE.IN
                }
            } as FilterModel;


        } else {
            // Gestione selezione singola
            setIsLoadingMissingOptions(false);

            let option = defaultOptions.find(d => d.value == selectedValue);
            if (!option) {

                areOptionsMissing = true;

                filterModel = {
                    ...filterModel,
                    [fields.keyField]: {
                        filter: selectedValue,
                        filterType: "number",
                        type: AG_GRID_FILTER_TYPE.EQUALS
                    }
                } as FilterModel;

            } else if (option) {
                setCurrentOption(option);
                currentOptionRef.current = option;
                return;
            }
        }

    }, [defaultOptions, selectedValue, readonly, disabled]);

    useEffect(() => {

        if (disabled) return;

        if (isInitialized.current || !optionConfig?.allowMultiSelection || currentOptionList.length == 0) return;

        setCurrentOptionList(prev => (
            prev.map(option => ({ ...option, isAdded: false, isChanged: false, isDeleted: false }))
        ))

    },[]);

    useEffect(() => {

        if (disabled) return;

        let fields = _getOptionFields();
        setSearchFields(searchColFields ?? [fields.valueFields[0]]);
    }, [searchColFields]);

    const _renderAdditionalLabel = (data: any) => (
        <div className="d-flex small">
        { optionConfig?.valueDetails?.map((detail, idx) => (
            < div key={idx} className="d-flex align-items-center">
                {data[detail.colField] && detail.ico &&
                    <div className="d-flex ids-combobox-detail-ico me-1">
                        {detail.ico}
                    </div>
                }
                {data[detail.colField] && detail.label &&
                    <div className="me-1">{detail.label}</div>
                }
                <div className="me-2 ids-combobox-text-truncate">
                    {_getContent(data, detail)}
                </div>
            </div>
        ))}
        </div>
    );

    const _getOptionFields = useCallback(() => {

        return {
            keyField: optionConfig?.keyColField ?? 'id',
            valueFields: optionConfig?.valueColFields ?? ['name']
        }

    }, [optionConfig]);


    const _convertInBulkItem = (option: TableComboboxOption, isAdded: boolean, isChanged: boolean, isDeleted: boolean) => {
        return {
            item: option,
            isAdded: isAdded,
            isChanged: isChanged,
            isDeleted: isDeleted
        } as BulkItem;
    }

    const _getContent = (data: any, detail: ComboboxDetail) => {

        let content = data[detail.colField];

        switch(detail.formatAs) {
            case ComboboxDetailFormatType.DATE:
                content = AppHelper.formatDate(content, false);
                break;
            case ComboboxDetailFormatType.CURRENCY:
                content = AppHelper.formatCurrency(content);
                break;
            default:
                break;

        }

        return content;
    }

    const _onChange = (option: TableComboboxOption | BulkItem, e?: ActionMeta<TableComboboxOption | BulkItem>) => {

        let event = {
            target: {
                id: id,
                value: undefined,
                raw: undefined
            }
        };

        if(isBulkItem(option)) {

            let removeFromList = false;
            let newItem = currentOptionList.filter(o => o.item.value == option?.item.value);

            let isExistingItem = newItem.length > 0;
            if (isExistingItem && e.action == 'select-option') {
                // se esiste e provo a riaggiungerlo,
                // non modifico il suo bulkItem status
                return;
            }

            //item nuovo rimosso prima del salvataggio
            if (option.isDeleted && option.isAdded) {
                removeFromList = true;
                option.isAdded = false;
                option.isDeleted = false;

            } else if(!option.isDeleted && !option.isAdded)
                //nuovo item aggiunto
                option.isAdded = true;

            event = {
                target: {
                    id: id,
                    value: option //bulk item here
                }
            };

            
            if(newItem.length > 0) {
                //if exists
                setCurrentOptionList(prev => prev.map(o =>
                    o.item.value === option?.item.value
                        ? removeFromList ? null : option
                        : o
                ).filter(o => o != null));
            } else {
                setCurrentOptionList([...currentOptionList, option]);
            }



        } else {

            event = {
                target: {
                    id: id,
                    value: option?.value,
                    raw: option?.raw
                }
            };

            if(!option?.value) {
                setCurrentOption(null);
                currentOptionRef.current = null;
            } else {
                setCurrentOption(option);
                currentOptionRef.current = option;
            }


        }

        onChange(event);

    }

    //caricamento dati da backend - START
    const fetchTimeoutRef = useRef<NodeJS.Timeout>(null);
    const loadOptions = (
        inputValue: string,
        callback: (options: any[]) => void
    ) => {

        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }

        // fetchTimeoutRef.current = setTimeout(async () => {
        //     optionsRef.current = await fecthData(inputValue);
        //     setDefaultOptions(optionsRef.current);
        //     callback(optionsRef.current);
        // }, 500);
    };
    //caricamento dati da backend - END

    //
    // READONLY CONFIG - START
    //
    //superati questi caratteri il readonly input diventa una textarea
    const readonlyTexareaThreshold = 50;

    const readonlyValue = useMemo(() => { return readonlyRootData ? readonlyRootData[readonlyFormGroup?.readonlyColId ?? id.replace(/Id$/, 'Name')] ?? '-' : ''
    }, [readonlyRootData]);

    const readonlyLightValue = useMemo(() => {
        return data && readonlyFormGroup?.lightModeColId ? data[readonlyFormGroup?.lightModeColId] ?? '-' : ''
    }, [readonlyRootData]);
    //
    // READONLY CONFIG - END
    //

    const getValueDetailsMainLabel = (raw: any) => {
        //ottiene l'etichetta da visualizzare 
        //a partire dai valueColFields
        let label = '';

        if(!raw) return label;

        optionConfig?.valueColFields?.forEach((field) => {
            label = label.concat(raw[field]).concat(' ');    
        });

        return label;
    }

    return (
        <>

            {(disabled || readonly) && !readonlyRootData && readonlyFormGroup?.lightModeColId &&
                <Form.Control
                    name={id}
                    as={`${readonlyLightValue?.length > readonlyTexareaThreshold ? 'textarea' : 'input'}`} 
                    type={`${readonlyLightValue?.length > readonlyTexareaThreshold ? '' : 'text'}`}
                    value={readonlyLightValue}
                    rows={5}
                    readOnly={readonly}
                    disabled={disabled}
                />
            }

            {(disabled || readonly) && readonlyRootData &&
                <Form.Control
                    name={id}
                    as={`${readonlyValue?.length > readonlyTexareaThreshold ? 'textarea' : 'input'}`}
                    type={`${readonlyValue?.length > readonlyTexareaThreshold ? '' : 'text'}`}
                    value={readonlyValue}
                    rows={5}
                    readOnly={readonly}
                    disabled={disabled}
                />
            }

            {(disabled || readonly) && readonlyFormGroup?.details && readonlyRootData && (
                
                <div className="my-2 p-2 border rounded">
                    <div className="d-flex small">
                        {readonlyFormGroup.details.map((detail: any, idx: number) => (
                            <div key={idx} className="d-flex">
                                {readonlyRootData?.[detail.colField] && detail.ico && (
                                    <div className="d-flex ids-combobox-detail-ico me-1">
                                        {detail.ico}
                                    </div>
                                )}
                                {readonlyRootData?.[detail.colField] && detail.label && (
                                    <div className="me-1">{detail.label}</div>
                                )}
                                <div className="me-2">
                                    {readonlyRootData?.[detail.colField]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!(disabled || readonly) && 
            <>
            {(isLoading || isLoadingMissingOptions) && <LoadingOverlay variant={"transparent"} />}

            {/* patch per validazione - start */}
            <Form.Control
                ref={controlRef}
                required={required}
                hidden={true}
                value={currentOptionRef.current ? ' ' : ''}
                onChange={() => { }}
            />
            {/* patch per validazione - end */}

            <AsyncSelect 
menuPortalTarget={document.body}   // ← aggiunge questo
    menuPosition="fixed"               // ← e questo
    styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),

        option: (base) => ({ ...base, fontSize: '0.8rem' }),       // font opzioni nel menu
        singleValue: (base) => ({ ...base, fontSize: '0.8rem' }),  // font valore selezionato
        input: (base) => ({ ...base, fontSize: '0.8rem' }),        // font input di ricerca

    }}


                inputId={id.concat('Select')} 
                name={id.concat('Select')}
                // disabled={disabled} 
                classNamePrefix="ids-combobox"
                className={`ids-combobox ${isValid == null ? ' ' : isValid ? 'ids-combobox-valid' : 'ids-combobox-invalid'}`}
                required={required}
               // loadOptions={loadOptions}
                defaultOptions={defaultOptions}
                placeholder={optionConfig?.placeholder}
                noOptionsMessage={() => optionConfig?.noDataPlaceholder ?? 'Nessun dato disponibile.'}
                loadingMessage={() => 'Caricamento...'}
                isSearchable={optionConfig?.isSearchable ?? false}
                onChange={_onChange}
                isClearable={(optionConfig?.isClearable && renderValueOnInput) ?? false}
                value={isBulkItem(currentOption) ? currentOption?.item ?? {} as TableComboboxOption : currentOption?.value ? currentOption : null}
                controlShouldRenderValue={renderValueOnInput}
                formatOptionLabel={(option, { context }) => (
                    <>
                        <div>{isBulkItem(option) ? option.item.label : option.label}</div>
                    {context === 'menu' &&
                    <>
                        <div>{isBulkItem(option) ? option.item.additionalLabel ?? '' : option.additionalLabel ?? ''}</div> 
                    </>
                    }
                    </>
                )}
            />
            {optionConfig?.showInfoButton &&
                <InfoButton
                    htmlContent={
                        <div>
                            <div className='h6'>Ricerca nel componente</div>
                            <div className='mb-1'>Puoi filtrare gli elementi per : </div>
                            <ul>
                                {optionConfig?.searchColFields?.map((col, idx) => (
                                    <li key={idx}>
                                        {translationPath ? 
                                            TranslationHelper.getProperty(t, AppPathHelper.build(translationPath, col)) : 
                                            TranslationHelper.getProperty(t, AppPathHelper.build(domain.split('.')[1], domain.split('.')[1], 'columns', col))
                                        }
                                    </li>))}
                            </ul>
                        </div>}
                    placement='right-end'
                    className='mb-3 position-absolute top-0 ids-right-10'
                    tooltip='Info sulla ricerca'
                />
            }
            
            {!isBulkItem(currentOption) && currentOption?.raw && optionConfig?.details && !optionConfig?.allowMultiSelection &&
            <div className="my-2 px-2 pb-2 border rounded"> 

                {/* TODO: migliora questo popolamento */}
                <div className="d-flex fw-bold mt-1 justify-content-between">
                    {optionConfig && optionConfig.valueColFields ? getValueDetailsMainLabel(currentOption?.raw) : ''}
                    <div>
                        {optionConfig?.actions?.map((action, actionIdx) => (
                            <GenericButton key={`option-action-${actionIdx}`}
                                onClick={() => { action.onClick(currentOption) }}
                                className="ids-no-border p-1"
                                tooltip={action.tooltip}
                                buttonConfig={action.buttonConfig}
                            />
                        ))}

                        {!(optionConfig?.isClearable && renderValueOnInput) &&
                        <GenericButton
                            onClick={() => {
                                //setCurrentOption(null);
                                //currentOptionRef.current = null;
                                _onChange({
                                    ...currentOption,
                                    value: undefined,
                                    raw: undefined
                                });
                            }}
                            className="ids-no-border p-1 ms-3"
                            tooltip={`${t.common.buttons.delete}`}
                            buttonConfig={{
                                icon: <FaTimes />,
                                color: IdsColor.RED,
                                variant: IdsVariant.LIGHT

                            } as GenericButtonConfig}
                        />
                        }
                    </div>
                </div>
                
                <div className="d-flex small ">
                
                   
                    {optionConfig?.details?.map((detail, idx) => (
                        <div key={idx} className="d-flex align-items-center mt-1">
                            {(currentOption?.raw[detail.colField] || currentOption?.raw[detail.colField] == 0) && detail.ico &&
                            <div className="d-flex ids-combobox-detail-ico me-1">
                                {detail.ico}
                            </div>
                            }
                            {currentOption?.raw[detail.colField] && detail.label &&
                                <div className="me-1">{detail.label}</div>
                            }
                            <div className="me-2 ids-combobox-text-truncate">
                                {_getContent(currentOption?.raw, detail)}
                            </div>      
                        </div>
                    ))}
                </div>
            </div>
            }


            {currentOptionList.length > 0 && optionConfig?.allowMultiSelection &&
                currentOptionList.map((option, index) => (

                    <div key={index} className={`my-2 px-2 pb-2 border rounded ${option?.isDeleted ? 'ids-dragdrop-mark-delete' : ''}`}>

                        {/* TODO: migliora questo popolamento */}
                        <div className="d-flex fw-bold mt-1 justify-content-between">
                            {optionConfig && optionConfig.valueColFields ? getValueDetailsMainLabel(option?.item.raw) : ''}
                            <div>
                                {optionConfig?.actions?.map((action, actionIdx) => (
                                    <GenericButton key={`option-action-${actionIdx}`}
                                        onClick={() => { action.onClick(option?.item) }}
                                        className="ids-no-border p-1"
                                        tooltip={action.tooltip}
                                        buttonConfig={action.buttonConfig}
                                    />
                                ))}

                                <GenericButton
                                    onClick={() => {
                                        option.isDeleted = !option.isDeleted;
                                        _onChange(option, { action: 'deselect-option' } as ActionMeta<TableComboboxOption | BulkItem>);
                                    }}
                                    className="ids-no-border p-1 ms-3"
                                    tooltip={`${option?.isDeleted ? t.common.buttons.undo : t.common.buttons.delete}`}
                                    buttonConfig={{
                                        icon: option?.isDeleted ? <FaUndoAlt /> : <FaTimes />,
                                        color: IdsColor.RED,
                                        variant: IdsVariant.LIGHT

                                    } as GenericButtonConfig}
                                />
                            </div>
                        </div>

                        <div className="d-flex small ">


                            {optionConfig?.details?.map((detail, idx) => (
                                <div key={idx} className="d-flex align-items-center mt-1">
                                    {(option?.item.raw[detail.colField] || option?.item.raw[detail.colField] == 0) && detail.ico &&
                                        <div className="d-flex ids-combobox-detail-ico me-1">
                                            {detail.ico}
                                        </div>
                                    }
                                    {option?.item.raw[detail.colField] && detail.label &&
                                        <div className="me-1">{detail.label}</div>
                                    }
                                    <div className="me-2 ids-combobox-text-truncate">
                                        {_getContent(option?.item.raw, detail)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                ))
            }

            </>
            }

        </>);

}

export default TableCombobox;
