import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Button, ButtonGroup, Col, Form, Row, Stack } from 'react-bootstrap';

import type {
    ColDef,
    ColumnState
} from "ag-grid-community";

import { GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import type { ColumnChooserProps } from '../../types/TableColumn';
import { PermissionHelper } from '../../../../../core/auth/helpers/PermissionHelper';
import useAuth from '../../../../../core/auth/hooks/useAuth';
import { useTableContext } from '../../hooks/useTableContext';

export interface ColumnChooserCallbacks {
    selectAll: () => void;
    resetPreferences: (savePreferences: boolean) => void;
    applyChanges: (savePreferences: boolean) => void;
}

const ColumnChooser: React.FC<ColumnChooserProps> = forwardRef(({
    domain,
    defaultColumnDefs,
    metadata,
    gridApi
}, ref) => {
    const [columns, setColumns] = useState<ColumnState[]>([]);
    const [resetPref, setResetPref] = useState<boolean>(false);

    const auth = useAuth();
    const tableContext = useTableContext();
    const gridSettingsHandler = tableContext.gridSettingsHandler;

    useImperativeHandle(ref, () => ({
        //funzioni esposte al componente padre
        selectAll: () => {
            if(columns.filter((col) => { return !col.hide }).length === columns.length)
                setColumns(prev => prev.map(col => ({ ...col, hide: true })));
            else
                setColumns(prev => prev.map(col => ({ ...col, hide: false })));
        },
        resetPreferences: (savePreferences: boolean) => {
            setResetPref(true);
            let defaultColumns = loadDefaultColumns();
            setColumns(defaultColumns);
            gridSettingsHandler.setIsModified(true);
        },
        applyChanges: (savePreferences: boolean) => {
            applyChanges(savePreferences);
        }
    }));

    useEffect(() => {
        //init column chooser
        if (gridApi && defaultColumnDefs) {
            loadCurrentColumnState();
        }
    }, [defaultColumnDefs, gridApi]);

    const toggleColumnVisibility = (colId: string) => {
        setColumns(prev =>
            prev.map(col =>
                col.colId === colId
                    ? { ...col, hide: !col.hide }
                    : col
            )
        );
        gridSettingsHandler.setIsModified(true);
    };

    const moveColumn = (fromIndex: number, toIndex: number) => {
        setColumns(prev => {
            const newColumns = [...prev];
            const [moved] = newColumns.splice(fromIndex, 1);
            newColumns.splice(toIndex, 0, moved);
            return newColumns.map((col, index) => ({ ...col, order: index }));
        });
        gridSettingsHandler.setIsModified(true);
    };

    const applyChanges = (savePreferences: boolean) => {

        if (!gridApi) return;
        // Applica le modifiche alla griglia
        const columnState = columns.map((col) => ({
            colId: col.colId,
            headerName: col.headerName,
            hide: col.hide,
            sort: null,
            sortIndex: null,
            width: col.width
        }));

        gridApi.applyColumnState({
            state: columnState,
            applyOrder: true
        });

        gridSettingsHandler.saveGridSettings(columnState, savePreferences);

    };

    const loadCurrentColumnState = useCallback(() => {

        let columnStates = [] as ColumnState[];

        //hdsColDefsMap - struttura dati di sostegno per setting column state
        let hdsColDefsMap = new Map();
        defaultColumnDefs?.forEach((col, index) => {
            hdsColDefsMap.set(col.field,
                {
                    headerName: col.headerName || col.field || `Column ${index}`,
                    hide: col.hide
                });
        });

        gridApi.getColumnState().forEach((col: ColumnState) => {
            let hdsColDef = hdsColDefsMap.get(col.colId);
            if (!checkAddColumnState(col, hdsColDef))
            {
                return;
            }
            columnStates.push(col);
        });

        //set header names
        columnStates.forEach((col) => {
            col.headerName = hdsColDefsMap.get(col.colId)?.headerName ?? col.colId;
        });
        
        setColumns(columnStates.sort((a, b) => a.order - b.order));
    }, [metadata, defaultColumnDefs]);

    const loadDefaultColumns = useCallback(() => {

        let columnStates = [] as ColumnState[];

        defaultColumnDefs?.forEach((col, index) => {

            if (!checkAddColumnState(col, null)) {
                return;
            }

            const colState = {
                colId: col.field || col.colId || `col-${index}`,
                headerName: col.headerName || col.field || `Column ${index}`,
                hide: col.hide,
                order: index,
                width: col.width
            } as ColumnState;
            columnStates.push(colState);

        });

        let orderedDefColumnStates = columnStates?.sort((a, b) => a.order - b.order);
        setColumns(orderedDefColumnStates);

        return orderedDefColumnStates;

    }, [metadata, defaultColumnDefs]);

    /**
     * Determina quali colonne mostrare in elenco
     * 
     * @param col 
     * @param hdsColDef 
     * @returns 
     */
    const checkAddColumnState = useCallback((col: ColumnState | ColDef, hdsColDef?: any): boolean => {

        let _colId = "colId" in col ? col.colId : "field" in col ? col.field : "";

        if (_colId?.startsWith('_')) {
            // internal system columns - colonne aggiunte alla entity per system purposes
            // es. colonna delle azioni -> _actions
            // skip
            return false;
        }

        let systemColumns = metadata.systemColumns;
        if(systemColumns.includes(_colId)) {
            // system columns - presenti nella entity ma da non mostrare all'utente - utili solo per sistema
            // es. agentId per filtrare i preventivi utente (per agente associato all'utente)
            // skip
            return false;
        }

        let user = auth.user;
        if (PermissionHelper.isAdmin(user))
            return true;

        let protectedColumns = metadata?.protectedColumns;
        if (protectedColumns.includes(_colId)) {
            // protectedColumns columns - presenti nella entity ma da non mostrare all'utente - utili solo per sistema
            // es. agentId per filtrare i preventivi utente (per agente associato all'utente)
            // skip
            return false;
        }
        
        return true;

    }, [metadata]);

    if (!gridApi || !defaultColumnDefs) return <div><p>Scelta colonne non disponibile</p></div>;

    return (
        <>

            <Stack gap={3} className='ids-col-chooser-container'>
                {columns.map((column, index) => (
                    <Row
                        key={column.colId}
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData('text/plain', index.toString()); }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                            moveColumn(fromIndex, index);
                        }}
                        className='border-bottom m-2 mx-5 pb-2 cursor-pointer'
                    >
                        <Col>
                            <div className='d-flex gap-2' onClick={() => toggleColumnVisibility(column.colId)}>
                                <span><GripVertical size={18} /></span>
                                <Form.Check
                                    type='checkbox'
                                    checked={!column.hide}
                                    onChange={() => toggleColumnVisibility(column.colId)}
                                />
                                <p>{column.headerName}</p>
                               
                            </div>
                        </Col>
                        <Col className='text-end'>
                            <ButtonGroup>
                                {index > 0 && (
                                    <Button
                                        onClick={() => moveColumn(index, index - 1)}
                                        title="Sposta su"
                                    >
                                        <ArrowUp size={15} />
                                    </Button>
                                )}
                                {index < columns.length - 1 && (
                                    <Button
                                        variant='secondary'
                                        onClick={() => moveColumn(index, index + 1)}
                                        title="Sposta giù"
                                    >
                                        <ArrowDown size={15} />
                                    </Button>
                                )}

                            </ButtonGroup>
                        </Col>
                       
                        
                    </Row>
                ))}
            </Stack>


        </>

    );
});

export default ColumnChooser;
