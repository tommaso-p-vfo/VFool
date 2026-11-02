import { useEffect, useState } from 'react';
import { ThemeColor, toCssColor } from '../../../../utils/Color';
import CustomProgressBar from '../../../CustomProgressBar';
import { Container } from 'react-bootstrap';

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
const ProgressBarCellRenderer: React.FC<any> = ({ data, colId, defaultColor }: {
    data: any, colId: string, defaultColor?: string }) => {


    const [color, setColor] = useState<string>(ThemeColor.PRIMARY);

    useEffect(() => {

        if(!data) return; 

        let _color = defaultColor ?? ThemeColor.PRIMARY;
        let _bgColor = toCssColor(_color);
        setColor(_bgColor);

    }, [defaultColor]);

    return (
        <Container className="progress-bar-container d-flex justify-content-start align-items-start">
            <CustomProgressBar value={data?.[colId] ?? 0} color={color} />
        </Container>
    );

}

export default ProgressBarCellRenderer;
// export { MainFieldHeader }
