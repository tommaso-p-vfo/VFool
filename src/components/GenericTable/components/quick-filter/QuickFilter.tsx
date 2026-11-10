import type { GridApi } from 'ag-grid-community';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { GenericButton, type GenericButtonConfig } from '../../../GenericButton';
import { useTableContext } from '../../hooks/useTableContext';
import { TableHelper } from '../../helpers/TableHelper';
// import { FilterChooser } from '../custom-filter/FilterChooser';
import { FaFunnelDollar, FaSlidersH } from 'react-icons/fa';
import { InfoButton } from '../../../InfoButton';
import { GenericModal } from '../../../modals/GenericModal';
import { buildPath, ThemeColor, ThemeVariant } from '../../../../utils';
import { FilterPanel } from '../custom-filter/FilterPanel';
import { getTranslation } from '../../../../utils/TranslationHelper';
import { QuickSearchInternalHandler, TableFilterInternalHandler } from '../custom-filter/hooks/useCustomFiltersLogic';
import { QuickSearchConfig } from '../../types/TableAttributes';

export type QuickFilterMetadata = {
    domain: string;
    searchFilterColumns?: string[];
    translatedSearchFilterColumns?: string[];
}

const QuickFilter = forwardRef((props: any, ref) => {

    const [shouldOpenModal, setShouldOpenModal] = useState<boolean>(false);

    const tableContext = useTableContext();

    const appearance = tableContext.appearance;
    const showUserFilter = appearance?.showUserFilter ?? true;

    const [gridApi, setGridApi] = useState<GridApi|null>(null);
    const [domain, setDomain] = useState<string | undefined>(undefined);

    const filterHandler = useMemo<TableFilterInternalHandler>(() => {
        return tableContext.filterHandler;
    }, [tableContext.filterHandler]);

    const quickSearchHandler = useMemo<QuickSearchInternalHandler>(() => {
        return filterHandler.quickSearchHandler;
    }, [filterHandler.quickSearchHandler]);

    const config = useMemo<QuickSearchConfig | undefined>(() => {
        return quickSearchHandler.config;
    }, [quickSearchHandler.config]);

    const { resetUserFilter } = filterHandler;

    const searchTimeoutRef = useRef<NodeJS.Timeout>(undefined);
    const [genericSearch, setGenericSearch] = useState<string>('');
    const [searchCols, setSearchCols] = useState<string[]>(config?.searchFilterColumns ?? ['name']); //default value

    useEffect(() => {
       setDomain(tableContext.domain?.agGridDomain);
    }, [tableContext.domain]);

    useEffect(() => {
        setGridApi(tableContext.gridApi);
    }, [tableContext.gridApi]);

    useEffect(() => {
        setSearchCols(config?.searchFilterColumns ?? ['name']);
    }, [config]);

    const onGenericSearchChange = useCallback((e) => {

        if(searchTimeoutRef.current)
        {
            clearTimeout(searchTimeoutRef.current);
        }
        
        let _value = e.currentTarget?.value;
        setGenericSearch(_value);

        //gestione manuale debounce time per digitazione genericSearch
        searchTimeoutRef.current = setTimeout(() => {

            if (gridApi) {
                //fast search text config (_genericSearch) - inserisco la colonna di default
                let searchFilter = {};
                searchCols.forEach(col => {

                    if(col == 'id') {
                        //number
                        searchFilter = {
                            ...searchFilter,
                            [col]: { filterType: "number", type: "equals", filter: _value }
                        };
                    } else {
                        //text
                        searchFilter = {
                            ...searchFilter,
                            [col]: { filterType: "text", type: "contains", filter: _value }
                        };
                    }
                    
                });
                
                searchFilter = {
                    ...quickSearchHandler.filter,
                    ...searchFilter
                };

                resetUserFilter();
                TableHelper.saveCurrentTableFilter(domain, searchFilter, _value);
                TableHelper.resetCurrentTablePage(domain);

                quickSearchHandler.setFilter(searchFilter);
                gridApi.setFilterModel(searchFilter);

            }

            clearTimeout(searchTimeoutRef.current);

        }, 500);

        
    }, [gridApi, quickSearchHandler.filter]);

    const onReset = useCallback(() => {

        if(!gridApi) {
            throw new Error('QuickFilter: context not properly initialized!');
        }

        const updatedFilter = Object.fromEntries(
            Object.entries(quickSearchHandler.filter ?? {}).filter(([key]) => 
                !searchCols.includes(key)
            )
        );

        const updatedFilterModel = Object.keys(updatedFilter).length > 0 ? updatedFilter : undefined;
        tableContext.filterHandler.quickSearchHandler.setFilter(updatedFilterModel);
        gridApi.setFilterModel(updatedFilterModel);
        setGenericSearch('');

        TableHelper.removeCurrentTableFilter(domain);
        TableHelper.removeCurrentQuickTableFilter(domain);

        resetUserFilter();

    }, [gridApi, quickSearchHandler.filter, resetUserFilter]);

    //
    // FILTRO - END
    //

    // useImperativeHandle(ref, () => ({
    //     quickFilterText: () => genericSearch ?? undefined,
    //     setQuickFilterText: (text:string) => { setGenericSearch(text ?? ''); }
    // }), [genericSearch]);

    return (
        <>
            <div className='d-flex vfo-quick-filter'>

                <InputGroup className="mb-3 ">
                    {showUserFilter && filterHandler.filterConfig.enableSavedFilters && <GenericButton
                        type='button' 
                        readableName='Gestisci i tuoi filtri'
                        tooltip='Gestisci i tuoi filtri'
                        onClick={() => { setShouldOpenModal(true); }}
                        buttonConfig={{
                            variant: ThemeVariant.OUTLINED,
                            color: ThemeColor.PRIMARY,
                            icon: <FaSlidersH />
                        } as GenericButtonConfig}
                        className='m-0 me-0 p-1 px-2'
                    /> }
                    {showUserFilter && filterHandler.filterConfig.enableSavedFilters && <FilterPanel />}
                    <Form.Control
                        id='vfo-search-filter'
                        placeholder="Cerca..."
                        aria-label="Cerca"
                        aria-describedby="vfo-filter"
                        onChange={onGenericSearchChange}
                        value={genericSearch}
                    />

                    <GenericButton 
                        className='ms-0' 
                        type='button'
                        readableName='Pulisci filtro corrente'
                        tooltip='Pulisci filtro corrente'
                        onClick={onReset}
                        buttonConfig={{
                            variant: ThemeVariant.OUTLINED,
                            color: ThemeColor.PRIMARY,
                            icon: <FaFunnelDollar size={18} />
                        } as GenericButtonConfig}
                    />

                </InputGroup>
                <InfoButton 
                    htmlContent={
                        <div>
                            <div className='h6'>Ricerca rapida</div>
                            <div className='mb-1'>Filtra i risultati della tabella per: </div>
                            <ul>
                                {searchCols.map((col, idx) => (<li key={idx}>{getTranslation(tableContext.t, buildPath('columns', col))}</li> ) )}
                            </ul>
                        </div>}
                    placement='right-end'
                    className='mb-3 ms-1'
                    tooltip='Info sulla ricerca rapida'
                />
            </div>
            <GenericModal title={"Impostazioni filtro"}
                shouldOpenModal={shouldOpenModal}
                onCloseModal={() => { setShouldOpenModal(false); }}
                children={<>
                    {/* <FilterChooser onFilterApplied={() => { setShouldOpenModal(false); }}/> */}
                
                </>
                }

                // actions={[

                //     {
                //         name: 'Crea',
                //         onClick: () => {}
                //     }

                // ]}
            />
        </>

    );

});

export default QuickFilter;