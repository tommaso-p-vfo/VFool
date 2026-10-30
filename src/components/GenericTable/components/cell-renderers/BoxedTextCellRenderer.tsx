import { useEffect, useState } from 'react';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import { Badge } from 'react-bootstrap';
import { IdsColor } from '../../../../../types/system/IdsColor';
import { COL_EMPTY_PLACEHOLDER } from '../../constants/tableConstants';

// /**
//  *
//  * Header Component
//  *
//  * @param props
//  * @returns
//  */
// const BoxedTextHeader = ({ displayName }: CustomHeaderProps) => {
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
const BoxedTextCellRenderer: React.FC<any> = ({ data, colId, boxedColorColId, defaultColor }: { data: any, colId: string, boxedColorColId: string, defaultColor?: string}) => {


    const [bgColor, setBgColor] = useState<string>(IdsColor.PRIMARY);

    useEffect(() => {

        if(!data) return; 
        
        let _color = data?.[boxedColorColId] ?? defaultColor;
        let _bgColor = UiHelper.getColor(_color);
        setBgColor(_bgColor.color);

    }, [data]);

    return (

        <>
            {!data?.[colId] &&
                <span>{COL_EMPTY_PLACEHOLDER}</span>
            }

            {data?.[colId] &&
                <Badge bg="" style={{ backgroundColor: bgColor }} className='px-2 py-1'>
                    { data?.[colId]?.toUpperCase() ?? COL_EMPTY_PLACEHOLDER }
                </Badge>
            }
        </>

    );

}

export default BoxedTextCellRenderer;
// export { BoxedTextHeader }
