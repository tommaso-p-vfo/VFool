import { ButtonGroup, Container } from "react-bootstrap";
import QuickFilter from "../quick-filter/QuickFilter";
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import ActionBar from "../actions/ActionBar";
import type { TableTopBarMetadata } from "./types/TableTopBarMetadata";
import GenericButton, { type GenericButtonConfig } from "../../../GenericButton";
import { IdsVariant } from "../../../../../types/system/IdsVariant";
import { IdsColor } from "../../../../../types/system/IdsColor";
import { FaCog, FaColumns } from "react-icons/fa";
import { useTableContext } from "../../hooks/useTableContext";
import { FilterShower } from "../custom-filter/FilterShower";

const TableTopBar = forwardRef((props: { gridApiRef: any, openColumnChooser: any, metadata: TableTopBarMetadata }, ref) => {

    const metadata = props?.metadata;
    const openColumnChooser = props?.openColumnChooser;

    const [openAdvfilter, setOpenAdvFilter] = useState<boolean>(false);

    const quickFilterRef = useRef(null);

    const _openColumnChoser = useCallback(() => {
        openColumnChooser(true);
    }, [openColumnChooser]);

    useImperativeHandle(ref, () => ({
        isGenericSearch: () => { return quickFilterRef.current?.isGenericSearch() },
        quickFilterText: () => quickFilterRef.current?.quickFilterText(),
        setQuickFilterText: (text: string) => { quickFilterRef.current?.setQuickFilterText(text) }
    }), [quickFilterRef]);


    return (
        <Container fluid className='w-100 d-flex justify-content-between'>
            <QuickFilter ref={quickFilterRef} gridApiRef={props?.gridApiRef} metadata={metadata.quickFilterMetadata} openAdvfilter={openAdvfilter} />
            <ActionBar 
                gridApiRef={props?.gridApiRef} 
                metadata={metadata.actionsMetadata} 
                actionBarConfig={metadata.actionBarConfig} 
                openColumnChooser={openColumnChooser}
            />
        </Container>
    );
});

export default TableTopBar;