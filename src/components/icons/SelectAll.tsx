import { FaCheckSquare } from 'react-icons/fa';
import { ThemeColor, toCssColor } from '../../utils';

export const SelectAll = ({ size, color }: { size?: number, color?: ThemeColor }) => {

    return (
        <div style={{ position: 'relative', display: 'inline-block', width: size ?? '1.5em', height: size ?? '1.5em' }}>
            <FaCheckSquare
                size={size ? size/2 : undefined}
                color={toCssColor(color)}
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    fontSize: '1em'
                }}
            />
            <FaCheckSquare
                size={size ? size / 2 : undefined}
                color={toCssColor(color)}
                style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    fontSize: '1em',
                    opacity: 0.7
                }}
            />
        </div> )
}