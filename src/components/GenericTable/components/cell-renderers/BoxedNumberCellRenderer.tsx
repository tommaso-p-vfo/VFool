import { useEffect, useState } from 'react';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import { Badge } from 'react-bootstrap';
import { IdsColor } from '../../../../../types/system/IdsColor';
import { COL_EMPTY_PLACEHOLDER } from '../../constants/tableConstants';

/**
 *
 * Header Component
 *
 * @param props
 * @returns
 */
const BoxedNumberHeader = ({ displayName }: any) => {
    return (
        <>
            <span className='text-center'>{displayName}</span>

        </>
    );
};

/**
 * Cell Renderer
 * 
 * @param props 
 * @returns 
 */
const BoxedNumberCellRenderer: React.FC<any> = ({ data, colId, defaultColor }: { data: any, colId: string, defaultColor?: string}) => {


    const [bgColor, setBgColor] = useState<string>(IdsColor.PRIMARY);

    useEffect(() => {

        if(!data) return; 

        let _color = defaultColor ?? IdsColor.PRIMARY;
        let _bgColor = UiHelper.getColor(_color);
        setBgColor(_bgColor.color);

    }, [data]);

    return (

        <div className='d-flex justify-content-center align-content-center align-items-center h-100'>
        { (!data?.[colId] || data?.[colId] == 0) &&
            <span>{COL_EMPTY_PLACEHOLDER}</span>
        }

        {data?.[colId] > 0 &&
            <Badge bg="" style={{ backgroundColor: bgColor }} className='px-2 py-1'>
                {data?.[colId]}
            </Badge>
        }
           
        </div>

    );

}

export default BoxedNumberCellRenderer;
export { BoxedNumberHeader }
