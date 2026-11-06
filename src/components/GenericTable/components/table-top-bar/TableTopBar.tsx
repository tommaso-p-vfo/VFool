import { Container } from "react-bootstrap";
import QuickFilter from "../quick-filter/QuickFilter";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import type { TableTopBarMetadata } from "./types/TableTopBarMetadata";
import { useTableContext } from "../../hooks/useTableContext";

const TableTopBar = forwardRef((props: { gridApiRef: any, openColumnChooser: any, metadata: TableTopBarMetadata }, ref) => {

    const tableContext = useTableContext();
    const appearance = tableContext.appearance;
    
    const metadata = props?.metadata;
    const openColumnChooser = props?.openColumnChooser;

    const quickFilterRef = useRef(null);

    const _openColumnChoser = useCallback(() => {
        openColumnChooser(true);
    }, [openColumnChooser]);

    useImperativeHandle(ref, () => ({
        quickFilterText: () => quickFilterRef.current?.quickFilterText(),
        setQuickFilterText: (text: string) => { quickFilterRef.current?.setQuickFilterText(text) }
    }), [quickFilterRef]);


    return (
        <Container fluid className='w-100 d-flex justify-content-between'>
            {appearance?.showQuickFilter && <QuickFilter ref={quickFilterRef} />}
            {/* <ActionBar 
                gridApiRef={props?.gridApiRef} 
                metadata={metadata.actionsMetadata} 
                actionBarConfig={metadata.actionBarConfig} 
                openColumnChooser={openColumnChooser}
            /> */}
        </Container>
    );
});

export default TableTopBar;