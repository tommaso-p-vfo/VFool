import React, { useRef } from 'react';
import { useTableContext } from '../../hooks/useTableContext';
import { copyToClipboard } from '../../../../utils/Clipboard';

interface CopyWrapperCellRendererProps {
    cellRenderer: React.ComponentType<any>;
    data: any;
    colId: string;
    colName: string;
    defaultColor?: string;
    defaultCurrency?: string;
    className?: string;
}

const CopyWrapperCellRenderer: React.FC<CopyWrapperCellRendererProps> = ({
    cellRenderer: CellRenderer,
    data,
    colId,
    colName,
    defaultColor,
    defaultCurrency,
    className
}) => {

    const target = useRef(null);

    const tableContext = useTableContext();
    const t = tableContext.t;

    return (
        <>
        <div 
            ref={target} 
            className={`cursor-pointer ids-hover-highlight mx-0 px-2`} 
            onClick={() => {

                if (!data || !data[colId]) return;

                copyToClipboard(data[colId], colName);

            }}
            title={`${data && data[colId] ? t.common.actions.copy + ' ' + colName : ''}`}
        >
            <CellRenderer        
                data={data}
                colId={colId}
                defaultColor={defaultColor}
                defaultCurrency={defaultCurrency}
                className={`vfo-text-truncate ids-collapse-wrapper ${className}`}
            />
        </div>
        </>
    );
}

export default CopyWrapperCellRenderer;
