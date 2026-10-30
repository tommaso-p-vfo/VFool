// ArrayIncludesFilter.tsx

// USAGE
// {
//     field: 'tags',
//     filter: ArrayIncludesFilter,
//     filterParams: {
//         // Opzione A — lista statica
//         options: [
//             { value: 'backend', label: 'Backend' },
//             { value: 'frontend', label: 'Frontend' },
//             { value: 'devops', label: 'DevOps' },
//         ],
//         // Opzione B — ometti options: le inferisce dai dati caricati
//
//         field: 'code',      // opzionale: chiave da leggere se l'array contiene oggetti, non stringhe
//         matchMode: 'any',   // opzionale: fissa la modalità e nasconde il toggle
//     },
//     cellRenderer: ListCellRenderer,
//     cellRendererParams: { colId: 'tags' },
// }

import React, { useCallback, useEffect, useState } from 'react';
import { type CustomFilterProps, useGridFilter } from 'ag-grid-react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { AG_GRID_FILTER_TYPE } from '../../constants/tableConstants';
import { useTableContext } from '../../hooks/useTableContext';
import GenericButton from '../../../GenericButton';
import type { ButtonConfig } from '../../types/TableFormGroup';
import { FaSearch, FaTimes } from 'react-icons/fa';
import LoadingOverlay from '../../../loading/GenericLoadingOverlay';
import type { PageRequest } from '../../../../../types/dto/PageTypes';
import { FilterTypeField, type FilterModel } from '../../../../../types/system/api/FilterModel';
import { IdsColor } from '../../../../../types/system/IdsColor';
import { IdsVariant } from '../../../../../types/system/IdsVariant';
import { UiHelper } from '../../../../../core/helpers/UiHelper';

interface ArrayIncludesActiveModel {
    filterColId: string;
    operator: 'AND' | 'OR';
    conditions: { filterType: string; type: string; filter: string }[];
}

interface ArrayIncludesFilterProps extends CustomFilterProps<any, any, ArrayIncludesActiveModel> {
    /**
     * Static list of options to display in the filter.
     * Each option has a value (sent to server) and a label (displayed in UI).
     * If not provided, options are inferred from the loaded rows.
     */
    options?: { value: string; label: string }[];

    /**
     * Chiave da leggere quando l'array della cella contiene oggetti invece di stringhe.
     */
    field?: string;

    /**
     * Filter mode:
     * - 'any': row matches if array contains AT LEAST ONE of the selected values (OR)
     * - 'all': row matches if array contains ALL selected values (AND)
     * Default: 'any'
     */
    matchMode?: 'any' | 'all';
}

// Pura, fuori dal componente: converte il model "ufficiale" della colonna
// (quello letto/scritto da onModelChange) nello stato che serve alla UI.
const deriveFromModel = (m?: ArrayIncludesActiveModel | null) => ({
    values: m?.conditions?.map(c => c.filter) ?? [],
    matchMode: (m?.operator === 'AND' ? 'all' : 'any') as 'any' | 'all',
});

export const ArrayIncludesFilter = (props: ArrayIncludesFilterProps) => {

    const { model, onModelChange, api, colDef, getValue, options: staticOptions, field, matchMode: fixedMatchMode } = props;
    
    const { listsMap, fetchLists, isLoadingData } = useTableContext();
    const domain = colDef?.filterParams.domain ?? undefined;

    const [searchField, setSearchField] = useState<string>('');

    // Build options: prefer static list, fallback to values from loaded rows
    const getOptions = useCallback((): { value: string; label: string }[] => {
        if (staticOptions?.length) return staticOptions;

        const valuesSet = new Set<string>();
        if (domain) {
            return (listsMap.get(domain) ?? []).map(v => ({ value: v.name, label: v.name }));
        }

        api.forEachNode(node => {
            const cellValue = node.data?.[colDef.field!];
            if (Array.isArray(cellValue)) {
                cellValue.forEach(v => {
                    field ? valuesSet.add(v[field]) : typeof v === 'string' && valuesSet.add(v);
                });
            }
        });

        return Array.from(valuesSet)
            .sort()
            .map(v => ({ value: v, label: v }));
    }, [staticOptions, field, colDef, api, domain, listsMap]);

    const [options, setOptions] = useState<{ value: string; label: string }[]>([]);

    // Selezione "in bozza" (non ancora applicata): SEMPRE derivata da `model` con la stessa funzione,
    // sia in init che in risincronizzazione — mai più letture dirette di model?.values altrove.
    const [selectedValues, setSelectedValues] = useState<string[]>(() => deriveFromModel(model).values);
    const [activeMatchMode, setActiveMatchMode] = useState<'any' | 'all'>(
        () => (model ? deriveFromModel(model).matchMode : fixedMatchMode ?? 'any')
    );

    // Se il model cambia dall'esterno (reset globale, deep-link, ecc.) risincronizza la UI
    useEffect(() => {
        const derived = deriveFromModel(model);
        setSelectedValues(derived.values);
        setActiveMatchMode(model ? derived.matchMode : fixedMatchMode ?? 'any');
    }, [model, fixedMatchMode]);

    // Memoizzato: cambia identità solo quando cambia davvero il model, non ad ogni render
    // (checkbox click, select all, ecc. NON devono far ricalcolare/riregistrare questo callback)
    const doesFilterPass = useCallback(
        ({ node }: { node: any }) => {
            if (!model?.conditions?.length) return true;
            const cellValue = getValue(node);
            if (!Array.isArray(cellValue)) return false;
            const rowValues = field ? cellValue.map((v: any) => v?.[field]) : cellValue;
            const wanted = model.conditions.map(c => c.filter);
            return model.operator === 'AND'
                ? wanted.every(w => rowValues.includes(w))
                : wanted.some(w => rowValues.includes(w));
        },
        [model, field, getValue]
    );

    const afterGuiAttached = useCallback(() => {
        setOptions(getOptions());
    }, [getOptions]);

    useEffect(() => {

        setOptions(getOptions());

    }, [listsMap]);

    useGridFilter({ doesFilterPass, afterGuiAttached });

    const handleCheckboxChange = (value: string, checked: boolean) => {
        setSelectedValues(prev =>
            checked ? [...prev, value] : prev.filter(v => v !== value)
        );
    };

    const handleSelectAll = () => setSelectedValues(options?.map(o => o.value));
    const handleDeselectAll = () => setSelectedValues([]);

    const applyFilter = () => {
        if (selectedValues.length === 0) {
            reset();
            return;
        }

        const nestedCol = colDef.field!.concat('.').concat(field!);

        const conditions = selectedValues.map(sv => ({
            filterType: 'text',
            type: AG_GRID_FILTER_TYPE.EQUALS,
            filter: sv,
        }));

        props.context.fromButtons = true;

        onModelChange({
            filterColId: nestedCol,
            operator: activeMatchMode === 'any' ? 'OR' : 'AND',
            conditions,
        });
    };

    const reset = () => {
        props.context.fromButtons = true;
        setSearchField('');
        fetchLists();

        setSelectedValues([]);
        onModelChange(null);
    };

    return (
        <div className="p-3" style={{ minWidth: 200, maxWidth: 280 }}>

            {/* Match mode toggle — visibile solo se non fissato dall'esterno */}
            <div className="d-flex gap-2 mb-2">
                {(['any', 'all'] as const).map(mode => (
                    <small
                        key={mode}
                        role="button"
                        onClick={() => setActiveMatchMode(mode)}
                        style={{
                            cursor: 'pointer',
                            fontSize: '0.72rem',
                            fontWeight: activeMatchMode === mode ? 700 : 400,
                            color: activeMatchMode === mode ? 'var(--bs-primary)' : 'var(--bs-secondary)',
                            borderBottom: activeMatchMode === mode ? '2px solid var(--bs-primary)' : '2px solid transparent',
                            paddingBottom: 1,
                        }}
                    >
                        {mode === 'any' ? 'Almeno uno (O)' : 'Tutti (E)'}
                    </small>
                ))}
            </div>

            <div className="d-flex justify-content-between mx-1 mb-2">
                <small role="button" className="text-primary" style={{ cursor: 'pointer', fontSize: '0.75rem' }} onClick={handleSelectAll}>
                    Seleziona tutti
                </small>
                <small role="button" className="text-secondary" style={{ cursor: 'pointer', fontSize: '0.75rem' }} onClick={handleDeselectAll}>
                    Deseleziona tutti
                </small>
            </div>

            <div
                style={{
                        maxHeight: 200,
                        border: '1px solid #dee2e6',
                        borderRadius: 4,
                        padding: '4px 8px',
                        background: '#fff',
                        position: 'relative'
                    }}
            >

                <InputGroup 
                    // style={{ height: 35 }} 
                    className='mb-2 mt-0 p-0'>
                    <Form.Control 
                        // style={{ width: 120 }}
                        placeholder='Cerca...'
                        value={searchField}
                        onChange={(e) => { setSearchField(e.target.value) }}
                    />
                    {searchField && <Button
                        title='Pulisci'
                        type='button'
                        className='mx-0'
                        style={{ 
                            color: UiHelper.getColor(IdsColor.LIGHT_GRAY).color, 
                            backgroundColor: 'white', 
                            height: 30,
                            width: 30,
                            position: 'absolute',
                            right: 53,
                            top: 1,
                            zIndex: 10

                        }}
                        // buttonConfig={{
                        //     icon: <FaTimes />,
                        //     color: IdsColor.LIGHT_GRAY,
                        //     variant: IdsVariant.LIGHT
                        // } as ButtonConfig}
                        onClick={async () => {
                            setSearchField('');
                            await fetchLists();
                        }}
                    ><FaTimes /></Button>}
                    <GenericButton
                        tooltip='Cerca'
                        readableName='Cerca categoria' 
                        type='button'
                        className='mx-0'
                        buttonConfig={{
                            icon: <FaSearch />,
                            color: IdsColor.PRIMARY,
                            variant: IdsVariant.LIGHT
                        } as ButtonConfig}
                        onClick={async () => {

                            let request = {
                                
                                filter: {
                                    name: {
                                        filterType: 'text',
                                        type: AG_GRID_FILTER_TYPE.CONTAINS,
                                        filter: searchField
                                    }
                                } as FilterModel

                            } as PageRequest;

                            await fetchLists(request);


                        }}
                    />
                </InputGroup>

                <div
                    style={{
                        maxHeight: 140,
                        overflowY: 'auto',
                        position: 'relative'
                    }}
                    >
                    {isLoadingData && <LoadingOverlay variant='primary'/>}
                    {options?.length === 0 && <small className="text-muted">Nessun valore disponibile</small>}
                    {options?.map(({ value, label }) => (
                        <Form.Check
                            key={value}
                            type="checkbox"
                            id={`array-filter-${value}`}
                            label={label}
                            checked={selectedValues.includes(value)}
                            onChange={e => handleCheckboxChange(value, e.target.checked)}
                            className="mb-1"
                            style={{ fontSize: '0.85rem' }}
                        />
                    ))}
                </div>
            </div>

            {selectedValues.length > 0 && (
                <small className="text-muted d-block mt-1">
                    {selectedValues.length} selezionat{selectedValues.length === 1 ? 'o' : 'i'}
                </small>
            )}

            <div className="ag-filter-apply-panel mt-3">
                <button onClick={reset} className="ag-button ag-standard-button ag-filter-apply-panel-button" type="button" tabIndex={0}>
                    Reimposta
                </button>
                <button onClick={() => {
                    applyFilter();
                }} 
                className="ag-button ag-standard-button ag-filter-apply-panel-button ag-filter-apply-panel-apply-button" type="button" tabIndex={1}>
                    Applica
                </button>
            </div>
        </div>
    );
};

ArrayIncludesFilter.displayName = 'ArrayIncludesFilter';