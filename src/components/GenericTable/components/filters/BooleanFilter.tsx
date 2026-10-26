// BooleanFilter.tsx
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { type IFilterParams } from 'ag-grid-community';
import { Form } from 'react-bootstrap';

export const BooleanFilter = forwardRef((props: IFilterParams, ref) => {
    const [filterValue, setFilterValue] = useState<string>('yes');

    useImperativeHandle(ref, () => ({
        
        // isFilterActive() {
        //     return filterValue !== 'all';
        // },

        // getModel() {
        //     if (filterValue === 'all') return null;
        //     return { filterType: 'boolean', value: filterValue };
        // },

        // setModel(model: any) {
        //     setFilterValue(model?.value || 'all');
        // }
    }));

    const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        let value = e.target.value;
        setFilterValue(value);
    };

    const applyFilter = () => {

        let value = filterValue;

        // if (value === 'all') {
        //     reset();
        //     return;
        // }

        const _value = value === 'yes';
        const col = props.colDef.field;

        let filter = props.api.getFilterModel() ?? {};
        filter = {
            ...filter,
            [col]: { filterType: "number", type: "equals", filter: _value }
        };

        props.context.fromButtons = true;
        props.api.setFilterModel(filter);

    };

    const reset = () => {
        props.context.fromButtons = true;
        props.api.setFilterModel({});
    };

    return (
        <div className='p-3'>
            <Form.Select value={filterValue} onChange={onChange} size="sm">
                {/* <option value="all">Tutti</option> */}
                <option value="yes">Sì</option>
                <option value="no">No</option>
            </Form.Select>
            <div className="ag-filter-apply-panel mt-3">
                <button onClick={reset} className="ag-button ag-standard-button ag-filter-apply-panel-button" type="button" tabIndex={0}>Reimposta</button>
                <button onClick={applyFilter} className="ag-button ag-standard-button ag-filter-apply-panel-button ag-filter-apply-panel-apply-button" tabIndex={1}>Applica</button>
            </div>
        </div>
        
    );
});

BooleanFilter.displayName = 'BooleanFilter';