import { useEffect, useState } from 'react';
import { ThemeColor, toCssColor } from '../../../../utils/Color';
import { COL_EMPTY_PLACEHOLDER } from '../../constants/tableConstants';

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
const EmphasizedTextCellRenderer: React.FC<any> = ({ data, colId, defaultColor, className }: { data: any, colId: string, defaultColor?: string, className?: string}) => {


    const [color, setColor] = useState<string>(ThemeColor.PRIMARY);

    useEffect(() => {

        if(!data) return; 

        let _color = defaultColor ?? ThemeColor.BLACK;
        let _bgColor = toCssColor(_color);
        setColor(_bgColor);

    }, [data]);

    return (

        <div>
        { (!data?.[colId] || data?.[colId] == 0) &&
            <span>{COL_EMPTY_PLACEHOLDER}</span>
        }

        { data?.[colId] &&
            <span className={`${className} fw-bold`} style={{ color: color }}>{data?.[colId]}</span>
        }
           
        </div>

    );

}

export default EmphasizedTextCellRenderer;
// export { MainFieldHeader }
