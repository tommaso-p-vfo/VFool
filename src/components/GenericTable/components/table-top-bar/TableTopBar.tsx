import { Container, InputGroup } from "react-bootstrap";
import QuickFilter from "../quick-filter/QuickFilter";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import type { TableTopBarMetadata } from "./types/TableTopBarMetadata";
import { useTableContext } from "../../hooks/useTableContext";
import { GenericButton, GenericButtonConfig } from "../../../GenericButton";
import { ThemeColor, ThemeVariant } from "../../../../utils";
import { FaCog, FaColumns, FaSave } from "react-icons/fa";

const TableTopBar = forwardRef((props: any, ref) => {

    const tableContext = useTableContext();
    const appearance = tableContext.appearance;
    
    // const metadata = props?.metadata;
    // const openColumnChooser = props?.openColumnChooser;

    const quickFilterRef = useRef(null);

    const openColumnChooser = useCallback(() => {
        // openColumnChooser(true);
    }, []);

    // useImperativeHandle(ref, () => ({
    //     quickFilterText: () => quickFilterRef.current?.quickFilterText(),
    //     setQuickFilterText: (text: string) => { quickFilterRef.current?.setQuickFilterText(text) }
    // }), [quickFilterRef]);


    return (
        <Container fluid className='w-100 d-flex justify-content-between'>
            {appearance?.showQuickFilter && <QuickFilter ref={quickFilterRef} />}
            {/* <ActionBar 
                gridApiRef={props?.gridApiRef} 
                metadata={metadata.actionsMetadata} 
                actionBarConfig={metadata.actionBarConfig} 
                openColumnChooser={openColumnChooser}
            /> */}
            {appearance?.showColumnSettings && <>

                <InputGroup className="w-auto gap-0 m-0 p-0 vfo-table-top-bar-btn vfo-table-top-bar-inputgrp-btn">
                    <GenericButton
                        type="button"
                        tooltip="Gestione colonne"
                        readableName="Gestione colonne"
                        onClick={openColumnChooser}
                        className="m-0"
                        buttonConfig={{

                            variant: ThemeVariant.OUTLINED,
                            color: ThemeColor.PRIMARY,
                            // backgroundColor: ThemeColor.PRIMARY,
                            icon: <div style={{ position: 'relative', display: 'inline-block' }}>
                                <FaColumns />
                                <FaCog style={{
                                    position: 'absolute',
                                    bottom: -2,
                                    right: -4,
                                    fontSize: '0.6em'
                                }} />
                            </div>
                        } as GenericButtonConfig}
                    />

                    <GenericButton
                        type="button"
                        readableName="Salva preferenze"
                        tooltip="Salva preferenze"
                        onClick={() => {
                            // gridSettingsHandler.saveGridSettings(gridApiRef.current.getColumnState(), true);
                        }}
                        className="m-0 px-2 no-border-left"
                        disabled={false} //!gridSettingsHandler.isModified}
                        buttonConfig={{

                            variant: ThemeVariant.OUTLINED,
                            color: ThemeColor.PRIMARY,
                            // backgroundColor: ThemeColor.PRIMARY,
                            icon: <FaSave size={12} />

                        } as GenericButtonConfig}
                    />

                </InputGroup>            

                {/* <ColumnSettingsModal
                // domain={columnChooserProps.domain}
                // tableName={columnChooserProps.tableName}
                // gridApi={columnChooserProps.gridApi}
                // defaultColumnDefs={columnChooserProps.defaultColumnDefs}
                // metadata={columnChooserProps.metadata}
                // shouldOpenModal={columnChooserProps.shouldOpenModal}
                // onCloseModal={() => { columnChooserProps.onCloseModal(); }}
                >
                </ColumnSettingsModal> */}
            
            </>}
        </Container>
    );
});

export default TableTopBar;