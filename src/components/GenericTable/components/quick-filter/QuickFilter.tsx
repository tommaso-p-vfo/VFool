import type { GridApi } from 'ag-grid-community';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
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

export type QuickFilterMetadata = {
    domain: string;
    searchFilterColumns?: string[];
    translatedSearchFilterColumns?: string[];
}

const QuickFilter = forwardRef((props: any, ref) => {

    const [shouldOpenModal, setShouldOpenModal] = useState<boolean>(false);

    const tableContext = useTableContext();
    const [gridApi, setGridApi] = useState<GridApi|null>(null);
    const [domain, setDomain] = useState<string | undefined>(undefined);

    const config = tableContext.quickSearch;

    const { resetActiveFilter, activeFilter } = tableContext.customFilterHandler;
        // const activeFilter = tableContext.activeFilter;

    const searchTimeoutRef = useRef<NodeJS.Timeout>(undefined);
    const [genericSearch, setGenericSearch] = useState<string>('');
    const [searchCols, setSearchCols] = useState<string[]>(config?.searchFilterColumns ?? ['name']); //default value
    // const [translatedSearchCols, setTranslatedSearchCols] = useState<string[]>(metadata?.translatedSearchFilterColumns ?? ['Nome']); //default value

    useEffect(() => {
       setDomain(tableContext.domain?.agGridDomain);
    }, [tableContext.domain]);

    useEffect(() => {
        setGridApi(tableContext.gridApi);
    }, [tableContext.gridApi]);

    useEffect(() => {

        setSearchCols(config?.searchFilterColumns ?? ['name']);
        // setTranslatedSearchCols(metadata?.translatedSearchFilterColumns ?? ['Nome']);

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
                let genericFilter = {};
                searchCols.forEach(col => {

                    if(col == 'id') {
                        //number
                        genericFilter = {
                            ...genericFilter,
                            [col]: { filterType: "number", type: "equals", filter: _value }
                        };
                    } else {
                        //text
                        genericFilter = {
                            ...genericFilter,
                            [col]: { filterType: "text", type: "contains", filter: _value }
                        };
                    }
                    
                });
                
                genericFilter = {
                    ...tableContext.filterData,
                    ...genericFilter
                };

                resetActiveFilter();
                TableHelper.saveCurrentTableFilter(domain, genericFilter, _value);
                TableHelper.resetCurrentTablePage(domain);

                tableContext.setFilterData(genericFilter);
                gridApi.setFilterModel(genericFilter);

            }

            clearTimeout(searchTimeoutRef.current);

        }, 500);

        
    }, [gridApi]);

    const onReset = useCallback(() => {

        if(!gridApi) {
            throw new Error('QuickFilter: context not properly initialized!');
        }

        const updatedFilter = Object.fromEntries(
            Object.entries(tableContext.filterData ?? {}).filter(([key]) => 
                !searchCols.includes(key)
            )
        );

        const updatedFilterModel = Object.keys(updatedFilter).length > 0 ? updatedFilter : undefined;
        tableContext.setFilterData(updatedFilterModel);
        gridApi.setFilterModel(updatedFilterModel);
        setGenericSearch('');

        TableHelper.removeCurrentTableFilter(domain);
        TableHelper.removeCurrentQuickTableFilter(domain);

        resetActiveFilter();

    }, [gridApi, tableContext.filterData, resetActiveFilter]);

    //
    // FILTRO - END
    //

    useImperativeHandle(ref, () => ({
        quickFilterText: () => genericSearch ?? undefined,
        setQuickFilterText: (text:string) => { setGenericSearch(text ?? ''); }
    }), [genericSearch]);

    return (
        <>
            <div className='d-flex vfo-quick-filter'>

                <InputGroup className="mb-3 ">
                    <GenericButton id="vfo-filter" 
                        tooltip='Gestisci i tuoi filtri'
                        onClick={() => { setShouldOpenModal(true); }}
                        buttonConfig={{
                            variant: ThemeVariant.OUTLINED,
                            color: ThemeColor.PRIMARY,
                            icon: <FaSlidersH />
                        } as GenericButtonConfig}
                        className='m-0 me-0 p-1 px-2'
                    />
                    {/* <FilterPanel filter={activeFilter} /> */}
                    <Form.Control
                        id='vfo-search-filter'
                        placeholder="Cerca..."
                        aria-label="Cerca"
                        aria-describedby="vfo-filter"
                        onChange={onGenericSearchChange}
                        value={genericSearch}
                    />


                    <GenericButton 
                        tooltip='Pulisci filtro corrente'
                        onClick={onReset}
                        buttonConfig={{
                            variant: ThemeVariant.OUTLINED,
                            color: ThemeColor.PRIMARY,
                            icon: <FaFunnelDollar size={18} />
                        } as GenericButtonConfig}
                        className='ms-0' type={'button'} readableName={''}                    />

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