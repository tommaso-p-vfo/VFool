import React, { useRef } from 'react';
import { toast } from 'react-toastify';
import useTranslations from '../../../../../locales/hooks/useTranslations';
import { AppHelper } from '../../../../../core/helpers/AppHelper';

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

    const t = useTranslations();

    return (
        <>
        <div 
            ref={target} 
            className={`cursor-pointer ids-hover-highlight mx-0 px-2`} 
            onClick={() => {

                if (!data || !data[colId]) return;

                AppHelper.copyToClipboard(data[colId], colName);

            }}
            title={`${data && data[colId] ? t.common.actions.copy + ' ' + colName : ''}`}
        >
            <CellRenderer        
                data={data}
                colId={colId}
                defaultColor={defaultColor}
                defaultCurrency={defaultCurrency}
                className={`ids-text-truncate ids-collapse-wrapper ${className}`}
            />
        </div>
        </>
    );
}

export default CopyWrapperCellRenderer;
