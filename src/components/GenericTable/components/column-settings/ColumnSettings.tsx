import React, { useState, useEffect, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import { Button, ButtonGroup, Col, Form, Row, Stack } from 'react-bootstrap';

import type {
    ColDef,
    ColumnState
} from "ag-grid-community";


// import { PermissionHelper } from '../../../../../core/auth/helpers/PermissionHelper';
// import useAuth from '../../../../../core/auth/hooks/useAuth';
import { useTableContext } from '../../hooks/useTableContext';
import { FaArrowDown, FaArrowUp, FaCheckSquare, FaGripVertical, FaSquare, FaToggleOn } from 'react-icons/fa';
import { ThemeColor, ThemeVariant, toCssColor } from '../../../../utils';
import { GenericButton } from '../../../GenericButton';
import { SelectAll } from '../../../icons/SelectAll';

export type ColumnChooserMetadata = {
    protectedColumns: string[];
    systemColumns: string[];
}

interface ColumnSettingsProps {
    ref: any
}

export type VfoColumnState = ColumnState & {
    headerName?: string;
    order?: number;
}

const CSS = `:where(.vfo-column-settings) {
    overflow-y: auto;
}`;

export const ColumnSettings: React.FC<ColumnSettingsProps> = forwardRef((props, ref) => {
    // const [areAllSelected, setAreAllSelected] = useState<boolean>(false);
    // const [columns, setColumns] = useState<ColumnState[]>([]);


    // const [savePreferences, setSavePreferences] = useState<boolean>(false);

    // const auth = useAuth();
    const tableContext = useTableContext();
    const { 
        columns,
        setColumns, 
        areAllSelected, 
        selectAll, 
        resetColumnSettings, 
        loadCurrentColumnState, 
        applyChanges,
        isModified
    } = tableContext.columnSettingsHandler;

    useImperativeHandle(ref, () => ({
        selectAll,
        resetColumnSettings,
        applyChanges,
        isModified
    }), [selectAll, resetColumnSettings, applyChanges, isModified]);

    useEffect(() => {
        //init
        loadCurrentColumnState();
    }, []);

    const toggleColumnVisibility = useCallback((colId: string) => {

        let _columns = columns.map(col =>
                col.colId === colId
                    ? { ...col, hide: !col.hide }
                    : col
            );
        setColumns(_columns);
    }, [columns]);

    const moveColumn = useCallback((fromIndex: number, toIndex: number) => {

        const newColumns = [...columns];
        const [moved] = newColumns.splice(fromIndex, 1);
        newColumns.splice(toIndex, 0, moved);
        let _columns = newColumns.map((col, index) => ({ ...col, order: index }));
        setColumns(_columns);
    }, [columns]);

    if (!columns) return <div><p>Scelta colonne non disponibile</p></div>;

    return (
        <>
            <style href="vfo-column-settings-css" precedence="default">
                {CSS}
            </style>
            <div>

                <Row
                    className='border-bottom m-2 mx-5 pb-2 cursor-pointer'
                >
                    <Col>
                        <div className='d-flex gap-2' title='Seleziona tutto' onClick={() => {}}>
                            <span><SelectAll size={18} color={toCssColor(ThemeColor.PRIMARY)} /></span>
                            <Form.Check
                                type='checkbox'
                                checked={areAllSelected}
                                onChange={() => { selectAll() }}
                            />

                        </div>
                    </Col>
                    
                </Row>

                {/* <Button onClick={selectAll} className='mx-2'>Seleziona tutto</Button> */}
                {/* <Button title='Ripristina le colonne di default' onClick={() => { resetPreferences(savePreferences) }}>Ripristina</Button> */}
            </div>
            <Stack gap={3} className='vfo-column-settings'>
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
                                <span><FaGripVertical size={18} /></span>
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
                                    <GenericButton
                                        type='button'
                                        buttonConfig={{
                                            color: ThemeColor.PRIMARY,
                                            variant: ThemeVariant.OUTLINED,
                                            icon: <FaArrowUp size={15} />

                                        }}
                                        onClick={() => moveColumn(index, index - 1)}
                                        tooltip="Sposta su"
                                        readableName="Sposta su"
                                    />
                                )}
                                {index < columns.length - 1 && (
                                    <GenericButton
                                        type='button'
                                        buttonConfig={{
                                            color: ThemeColor.PRIMARY,
                                            variant: ThemeVariant.OUTLINED,
                                            icon: <FaArrowDown size={15} />

                                        }}
                                        onClick={() => moveColumn(index, index + 1)}
                                        tooltip="Sposta giù"
                                        readableName="Sposta giù"
                                    />
                                )}

                            </ButtonGroup>
                        </Col>


                    </Row>
                ))}
            </Stack>
        </>

    );
});
