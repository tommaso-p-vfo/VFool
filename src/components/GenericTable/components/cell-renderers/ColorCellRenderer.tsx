import type { CustomHeaderProps } from 'ag-grid-react';
import { FaEyeDropper, FaSquare } from 'react-icons/fa';

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
const ColorCellRenderer: React.FC<any> = ({ data, field }: {data: any, field: string}) => {


    return (

        <>
            <FaSquare color={data?.[field]} fill={data?.[field]} />
        </>

    );

}

export default ColorCellRenderer;
export { ColorHeader }