import { useEffect, useState } from 'react';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import { IdsColor } from '../../../../../types/system/IdsColor';
import { COL_EMPTY_PLACEHOLDER } from '../../constants/agGridConstants';

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
const HighlightedTextCellRenderer: React.FC<any> = ({ data, colId, defaultColor, className }: {
    data: any, colId: string, defaultColor?: string, className?: string
}) => {


    const [color, setColor] = useState<string>(IdsColor.PRIMARY);

    useEffect(() => {

        if(!data) return; 

        let _color = defaultColor ?? IdsColor.PRIMARY;
        let _bgColor = UiHelper.getColor(_color);
        setColor(_bgColor.color);

    }, [data]);

    return (

        <div>
        { (!data?.[colId] || data?.[colId] == 0) &&
            <span>{COL_EMPTY_PLACEHOLDER}</span>
        }

        { data?.[colId] &&
            <div style={{ color: color }} className={className}>{data?.[colId]}</div>
        }
           
        </div>

    );

}

export default HighlightedTextCellRenderer;
// export { MainFieldHeader }
