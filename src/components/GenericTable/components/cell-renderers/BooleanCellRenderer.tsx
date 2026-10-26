import { useState } from 'react';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import { IdsColor } from '../../../../../types/system/IdsColor';
import useTranslations from '../../../../../locales/hooks/useTranslations';
import { FaCheck } from 'react-icons/fa';
import { AppHelper } from '../../../../../core/helpers/AppHelper';

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

    const t = useTranslations();

    const [color, ] = useState<string>(IdsColor.GREEN);

    (params: any) => params.value ? 
    
    t.common.buttons.yes : params.value != undefined ? 
    t.common.buttons.no : undefined;

    return (

        <>
            {value && value != undefined  && (<span className='d-flex align-items-center justify-content-center fw-bold gap-1' style={{ color: UiHelper.getColor(color).color}}>
                <span>Si</span>
                <FaCheck size={8} />
                </span>)}
            {value !== false && AppHelper.isNullEmptyOrUndefined(value) && (<span className='d-flex align-items-center justify-content-center gap-1'>
                <span>-</span>
                {/* <FaTimes size={8} /> */}
            </span>)}
            {!value && (<span style={{ color: UiHelper.getColor(IdsColor.RED).color }} className='d-flex align-items-center justify-content-center gap-1'>
                <span>No</span>
                {/* <FaTimes size={8} /> */}
            </span>)}

        </>
        
    );

}

export default BooleanCellRenderer;
// export { MainFieldHeader }
