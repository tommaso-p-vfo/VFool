import React, { useRef, useState } from 'react';
import { Overlay, Popover } from 'react-bootstrap';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import { IdsColor } from '../../../../../types/system/IdsColor';

interface CollapseWrapperCellRendererProps {
    cellRenderer: React.ComponentType<any>;
    data: any;
    colId: string;
    defaultColor?: string;
    defaultCurrency?: string;
    className?: string;
}

const CollapseWrapperCellRenderer: React.FC<CollapseWrapperCellRendererProps> = ({
    cellRenderer: CellRenderer,
    data,
    colId,
    defaultColor,
    defaultCurrency,
    className
}) => {

    const [show, setShow] = useState(false);
    const target = useRef(null);

    return (
        <>
        <div 
            ref={target} 
            className={`cursor-pointer ids-hover-highlight mx-0 px-2`} 
            onClick={() => setShow(!show)}
            title='Mostra contenuto completo'
        >
            <CellRenderer        
                data={data}
                colId={colId}
                defaultColor={defaultColor}
                defaultCurrency={defaultCurrency}
                className={`ids-text-truncate ids-collapse-wrapper ${className}`}
            />
        </div>
        <Overlay
            target={target.current}
            show={show} 
            placement="bottom-start"
            rootClose
            onHide={() => setShow(false)}
        >

            <Popover 
                className='no-arrow'
                style={{
                    minWidth: 300,
                    maxWidth: 400,
                    boxShadow: `${UiHelper.getColor(IdsColor.GRAY).color} 2px 3px 10px`
                }}
            >
                <Popover.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                    {data?.[colId]}
                </Popover.Body>
            </Popover>
        </Overlay>
        </>
    );
}

export default CollapseWrapperCellRenderer;
