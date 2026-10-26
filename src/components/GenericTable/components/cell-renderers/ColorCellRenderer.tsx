import type { CustomHeaderProps } from 'ag-grid-react';
import { Pipette, Square } from 'lucide-react';

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
            <Pipette className='hds-header-icon' />
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
            <Square color={data?.[field]} fill={data?.[field]} />
        </>

    );

}

export default ColorCellRenderer;
export { ColorHeader }