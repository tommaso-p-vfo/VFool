import type { ColDef } from 'ag-grid-community';
import type { ColumnChooserMetadata } from '../components/ColumnChoserModal';

interface  ColumnChooserProps {
    domain: string;
    defaultColumnDefs: ColDef[];
    metadata: ColumnChooserMetadata;
    gridApi: any;
    ref: any
}

interface ColumnState {
    colId: string;
    headerName: string;
    hide: boolean;
    order: number;
}

export type { ColumnChooserProps, ColumnState }