import type { GridApi } from 'ag-grid-community';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import type { QuickFilterMetadata } from './types/QuickFilterMetadata';
import { FunnelX } from 'lucide-react';
import GenericButton, { type GenericButtonConfig } from '../../../GenericButton';
import { IdsVariant } from '../../../../../types/system/IdsVariant';
import { IdsColor } from '../../../../../types/system/IdsColor';
import InfoButton from '../../../InfoButton';
import { useTableContext } from '../../hooks/useTableContext';
import { TableHelper } from '../../helpers/TableHelper';
import GenericModal from '../../../modals/GenericModal';
import { FilterChooser } from '../custom-filter/FilterChooser';
import { FaSlidersH } from 'react-icons/fa';
import { FilterShower } from '../custom-filter/FilterShower';

const QuickFilter = forwardRef((props: { gridApiRef: any, metadata: QuickFilterMetadata, openAdvfilter: any }, ref) => {

const metadata = props?.metadata;

const tableContext = useTableContext();
const { resetActiveFilter, activeFilter } = tableContext.customFilterHandler;
    // const activeFilter = tableContext.activeFilter;

const searchTimeoutRef = useRef<NodeJS.Timeout>(undefined);
const [genericSearch, setGenericSearch] = useState<string>('');
const [searchCols, setSearchCols] = useState<string[]>(metadata?.searchFilterColumns ?? ['name']); //default value
const [translatedSearchCols, setTranslatedSearchCols] = useState<string[]>(metadata?.translatedSearchFilterColumns ?? ['Nome']); //default value

useEffect(() => {

    setSearchCols(metadata?.searchFilterColumns ?? ['name']);
    setTranslatedSearchCols(metadata?.translatedSearchFilterColumns ?? ['Nome']);

}, [metadata]);

const onGenericSearchChange = (e) => {

    if(searchTimeoutRef.current)
    {
        clearTimeout(searchTimeoutRef.current);
    }
    
    let _value = e.currentTarget?.value;
    setGenericSearch(_value);

    //gestione manuale debounce time per digitazione genericSearch
    searchTimeoutRef.current = setTimeout(() => {

        let gridApi = props?.gridApiRef?.current; //tableContext.gridApi;
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
            TableHelper.saveCurrentTableFilter(metadata.domain, genericFilter, _value);
            TableHelper.resetCurrentTablePage(metadata.domain);

            tableContext.setFilterData(genericFilter);
            gridApi.setFilterModel(genericFilter);

        }

        clearTimeout(searchTimeoutRef.current);

    }, 500);

    
};

const onReset = () => {
    let gridApi: GridApi = props?.gridApiRef?.current;

    const updatedFilter = Object.fromEntries(
        Object.entries(tableContext.filterData ?? {}).filter(([key]) => 
            !searchCols.includes(key)
        )
    );

    const updatedFilterModel = Object.keys(updatedFilter).length > 0 ? updatedFilter : undefined;
    tableContext.setFilterData(updatedFilterModel);
    gridApi.setFilterModel(updatedFilterModel);
    setGenericSearch('');

    TableHelper.removeCurrentTableFilter(metadata.domain);
    TableHelper.removeCurrentQuickTableFilter(metadata.domain);

    resetActiveFilter();

};

//
// FILTRO - END
//

useImperativeHandle(ref, () => ({
    isGenericSearch: () => { return genericSearch ? true : false },
    quickFilterText: () => genericSearch ?? undefined,
    setQuickFilterText: (text:string) => { setGenericSearch(text ?? ''); }
}), [genericSearch]);


    const [shouldOpenModal, setShouldOpenModal] = useState<boolean>(false);

return (
    <>
        <div className='d-flex ids-quick-filter'>

            <InputGroup className="mb-3 ">
                <GenericButton id="ids-filter" 
                    tooltip='Gestisci i tuoi filtri'
                    onClick={() => { setShouldOpenModal(true); }}
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.PRIMARY,
                        icon: <FaSlidersH />
                    } as GenericButtonConfig}
                    className='m-0 me-0 p-1 px-2'
                />
                <FilterShower filter={activeFilter} />
                <Form.Control
                    id='ids-search-filter'
                    placeholder="Cerca..."
                    aria-label="Cerca"
                    aria-describedby="ids-filter"
                    onChange={onGenericSearchChange}
                    value={genericSearch}
                />


                <GenericButton 
                    tooltip='Pulisci filtro corrente' 
                    onClick={onReset}
                    buttonConfig={{
                        variant: IdsVariant.LIGHT,
                        color: IdsColor.PRIMARY,
                        icon: <FunnelX size={18}/>
                    } as GenericButtonConfig}
                    className='ms-0'
                    />

            </InputGroup>
            <InfoButton 
                htmlContent={
                    <div>
                        <div className='h6'>Ricerca rapida</div>
                        <div className='mb-1'>Filtra i risultati della tabella per: </div>
                        <ul>
                            {translatedSearchCols.map( (col, idx) => ( <li key={idx}>{col}</li> ) )}
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
            children={<FilterChooser onFilterApplied={() => { setShouldOpenModal(false); }}/>}

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