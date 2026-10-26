import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Button, Form, Container } from 'react-bootstrap';
import ColumnChooser, { type ColumnChooserCallbacks } from './ColumnChooser';
import type { ColDef } from 'ag-grid-community';

export type ColumnChooserMetadata = {
    protectedColumns: string[];
    systemColumns: string[];
}

export type ColumnChooserModalProps = {
    domain: string;
    tableName: string;
    defaultColumnDefs: ColDef[],
    metadata: ColumnChooserMetadata;
    gridApi: any;
    shouldOpenModal: boolean;
    onCloseModal: () => void;
}

const ColumnChooserModal: React.FC<ColumnChooserModalProps> = ({
        domain,
        tableName,
        defaultColumnDefs,
        metadata,
        gridApi,
        shouldOpenModal,
        onCloseModal
    }) => {

    //
    // column chooser handler - START
    // gestione parent/child per il funzionamento del componente column choser
    //

    //meccanismo ref per passaggio di funzioni dal figlio al padre
    //usato per le funzioni del footer della modal
    const columnChooserRef = useRef <ColumnChooserCallbacks>(null);
    const [colDefs, setColDefs] = useState<ColDef[]>([]);

    const [savePreferences, setSavePreferences] = useState<boolean>(false);

    const [openModal, setOpenModal] = useState<boolean>(false);

    useEffect(() => {
        setSavePreferences(false);
        setOpenModal(shouldOpenModal);
    }, [shouldOpenModal]);

    useEffect(() => {

        if (!defaultColumnDefs || defaultColumnDefs.length == 0) return;

        if(!metadata || metadata.systemColumns?.length == 0) {
            setColDefs(defaultColumnDefs);
            return;
        }
        
        let systemColumns = metadata.systemColumns;
        let filteredColDefs = defaultColumnDefs.filter(c => !systemColumns.includes(c.field));
        setColDefs(filteredColDefs);

    }, [defaultColumnDefs, metadata]);

    const close = useCallback(() => {
        onCloseModal();
    }, [onCloseModal]);

    const applyAndClose = useCallback(() => {
        columnChooserRef?.current?.applyChanges(savePreferences);
        close();
    }, [savePreferences, close]);

    const selectAllColumns = useCallback(() => {
        columnChooserRef?.current?.selectAll();
    }, []);

    const resetColumnPreferences = useCallback(() => {
        columnChooserRef?.current?.resetPreferences(savePreferences);
        // setSavePreferences(false);
    }, [savePreferences]);

    //
    // column chooser handler - END
    //

    return (
        <Modal show={openModal} onHide={close} size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>Gestione colonne - {tableName}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <ColumnChooser
                    domain={domain}
                    gridApi={gridApi}
                    defaultColumnDefs={colDefs}
                    metadata={metadata}
                    ref={columnChooserRef}
                ></ColumnChooser>
            </Modal.Body>
            <Modal.Footer>
                <Container fluid className='d-flex mx-4 align-items-center justify-content-between'>
                    <div>
                        <Button onClick={selectAllColumns} className='mx-2'>Seleziona tutto</Button>
                        <Button title='Ripristina le colonne di default' onClick={resetColumnPreferences}>Ripristina</Button>
                    </div>
                    <div className='d-flex align-items-center gap-3'>
                        <div className='d-flex align-items-center'>
                            <Form.Check
                                id='hds-save-preferences-cb'
                                type='checkbox'
                                checked={savePreferences}
                                onChange={() => { setSavePreferences(!savePreferences) }}
                                className='cursor-pointer'
                            />
                            <Form.Label htmlFor='hds-save-preferences-cb' className='cursor-pointer no-select ps-2 mb-0'>
                                Salva preferenze
                            </Form.Label>
                        </div>
                        <Button variant="primary" onClick={applyAndClose}>
                            Applica
                        </Button>
                    </div>
                </Container>
            </Modal.Footer>
        </Modal>
    );
};

export default ColumnChooserModal;