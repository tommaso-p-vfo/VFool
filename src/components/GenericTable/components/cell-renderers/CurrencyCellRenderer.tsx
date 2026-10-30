import { useEffect, useState } from 'react';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import { IdsColor } from '../../../../../types/system/IdsColor';
import { COL_EMPTY_PLACEHOLDER } from '../../constants/tableConstants';

/**
 *
 * Header Component
 *
 * @param props
 * @returns
 */
const CurrencyHeader = ({ displayName }: any) => {
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
const CurrencyCellRenderer: React.FC<any> = ({ data, colId, defaultColor, defaultCurrency }: { data: any, colId: string, defaultColor?: string, defaultCurrency?: "€|$"}) => {

    const [currency, setCurrency] = useState<string>("€");
    const [color, setColor] = useState<string>(IdsColor.PRIMARY);

    useEffect(() => {

        if (!data) return;

        let _color = defaultColor ?? IdsColor.PRIMARY;
        let _bgColor = UiHelper.getColor(_color);
        setColor(_bgColor.color);

        let _currency = defaultCurrency ?? "€";
        setCurrency(_currency);

    }, [data, defaultCurrency]);

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
                                       
                    {currency} 
                    
                </div>
            }

        </div>

    );

}

export default CurrencyCellRenderer;
export { CurrencyHeader }
