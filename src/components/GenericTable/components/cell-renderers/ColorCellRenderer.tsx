import type { CustomHeaderProps } from 'ag-grid-react';
import { FaEyeDropper, FaSquare } from 'react-icons/fa';
import { TableColumnParams } from '../../types/TableMetadata';

/**
 * 
 * Header Component
 * 
 * @param props 
 * @returns 
 */
const ColorHeader = ({ displayName }: CustomHeaderProps) => {
    return (
        <>
            <FaEyeDropper className='hds-header-icon' />
            <span>{displayName}</span>

        </>
    );
};

/**
 * Cell Renderer
 * 
 * @param props 
 * @returns 
 */
const ColorCellRenderer: React.FC<any> = ({ data, colId }: {data: any, colId: string, params?: TableColumnParams}) => {


    return (

        <>
            <FaSquare color={data?.[colId]} fill={data?.[colId]} />
        </>

    );

}

export default ColorCellRenderer;
export { ColorHeader }