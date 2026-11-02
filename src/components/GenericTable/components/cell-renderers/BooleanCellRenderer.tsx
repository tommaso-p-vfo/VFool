import { useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { useTableContext } from '../../hooks/useTableContext';
import { ThemeColor, toCssColor } from '../../../../utils/Color';
import { isNullEmptyOrUndefined } from '../../../../utils/Guards';

// /**
//  *
//  * Header Component
//  *
//  * @param props
//  * @returns
//  */
// const MainFieldHeader = ({ displayName }: CustomHeaderProps) => {
//     return (
//         <>
//             <Pipette className='hds-header-icon' />
//             <span>{displayName}</span>

//         </>
//     );
// };

/**
 * Cell Renderer
 * 
 * @param props 
 * @returns 
 */
const BooleanCellRenderer: React.FC<any> = ({ value }: {
    value: any }) => {

    const tableContext = useTableContext();
    const t = tableContext.t;

    const [color,] = useState<string>(ThemeColor.PRIMARY);

    (params: any) => params.value ? 
    
    t.common.buttons.yes : params.value != undefined ? 
    t.common.buttons.no : undefined;

    return (

        <>
            {value && value != undefined  && (<span className='d-flex align-items-center justify-content-center fw-bold gap-1' style={{ color: toCssColor(color)}}>
                <span>Si</span>
                <FaCheck size={8} />
                </span>)}
            {value !== false && isNullEmptyOrUndefined(value) && (<span className='d-flex align-items-center justify-content-center gap-1'>
                <span>-</span>
                {/* <FaTimes size={8} /> */}
            </span>)}
            {!value && (<span style={{ color: toCssColor(ThemeColor.RED) }} className='d-flex align-items-center justify-content-center gap-1'>
                <span>No</span>
                {/* <FaTimes size={8} /> */}
            </span>)}

        </>
        
    );

}

export default BooleanCellRenderer;
// export { MainFieldHeader }
