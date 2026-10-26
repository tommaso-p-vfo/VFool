import { useEffect, useState } from 'react';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import { IdsColor } from '../../../../../types/system/IdsColor';
import { COL_EMPTY_PLACEHOLDER } from '../../constants/agGridConstants';

/**
 *
 * Header Component
 *
 * @param props
 * @returns
 */
const CountabilityNumberHeader = ({ displayName }: any) => {
    return (
        <>
            {/* <Pipette className='hds-header-icon' /> */}
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
const CountabilityNumberCellRenderer: React.FC<any> = ({ data, colId, defaultColor, defaultSymbol }: { data: any, colId: string, defaultColor?: string, defaultSymbol?: any}) => {

    const [symbol, setSymbol] = useState<string>("%");
    const [color, setColor] = useState<string>(IdsColor.PRIMARY);

    useEffect(() => {

        if (!data) return;

        let _color = defaultColor ?? IdsColor.PRIMARY;
        let _bgColor = UiHelper.getColor(_color);
        setColor(_bgColor.color);

        let _symbol = defaultSymbol ?? "%";
        setSymbol(_symbol);

    }, [data, defaultSymbol]);

    return (

        <div className='d-flex justify-content-end align-content-end align-items-center h-100'>
            {(!data?.[colId] || data?.[colId] === 0) &&
                <span>{COL_EMPTY_PLACEHOLDER}</span>
            }

            {!(!data?.[colId] || data?.[colId] === 0) &&
                <div className='fw-bold' style={{ color: color }}>
                    {!isNaN(Number(data[colId]))
                    ? Number(data[colId])
                        .toFixed(2)
                        .toString()
                        .replace('.', ',')
                        .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
                    : data?.[colId].concat(' ')} 
                                       
                    {symbol} 
                    
                </div>
            }

        </div>

    );

}

export default CountabilityNumberCellRenderer;
export { CountabilityNumberHeader }
