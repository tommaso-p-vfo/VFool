import { Form } from "react-bootstrap";
import type { ColDef } from 'ag-grid-community';
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import type { FilterModel } from "../../../../../types/system/api/FilterModel";
import { FilterRow, type FilterRowHandle, type FilterRowValue } from "./components/FilterRow";

export type CustomFilterFormProps = { cols: ColDef[], currentFilter?: { name: string }, translationPath?: string }

export type CustomFilterFormHandler = {
    buildFilter: () => FilterModel;
    validate: () => boolean;
}

export const CustomFilterForm = forwardRef<CustomFilterFormHandler, CustomFilterFormProps>(
    ({ currentFilter, cols, translationPath }, ref) => {

        const [filterName, setFilterName] = useState(currentFilter?.name ?? '');

        // Un ref per ogni riga, indicizzato
        const rowRefs = useRef<(FilterRowHandle | null)[]>([]);

        useImperativeHandle(ref, () => ({ buildFilter, validate }));

        const validate = (): boolean => {
            if (!filterName.trim()) return false;

            // Valida tutte le righe e raccoglie i risultati
            const results = rowRefs.current.map(r => r?.validate() ?? true);
            return results.every(Boolean);
        };

        const buildFilter = (): FilterModel | undefined => {
            if (!validate()) return;

            const activeRows = rowRefs.current
                .map(r => r?.getFilterValue())
                .filter(Boolean) as FilterRowValue[];

            return {
                name: filterName,
                conditions: activeRows,
            };
        };

        return (
            <Form>
                <div className="mb-3">
                    <Form.Label className="small m-0">Nome filtro</Form.Label>
                    <Form.Control
                        required
                        placeholder="Nome filtro"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                    />
                </div>
                <div className="ids-custom-filter-container">
                    {cols?.map((col, idx) => (
                        <FilterRow
                            key={col.colId ?? idx}
                            ref={(el) => { rowRefs.current[idx] = el; }}
                            col={col}
                            translationPath={translationPath}
                        />
                    ))}
                </div>
            </Form>
        );
    }
);