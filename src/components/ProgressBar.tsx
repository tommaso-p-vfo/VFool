import React, { useEffect, useMemo, useState } from 'react';
import { ProgressBar as PB } from 'react-bootstrap';
import { ThemeColor, toCssColor } from '../utils/Color';

export const ProgressBar = ({ value, color }: { value: number, color?: string }) => {
    const [valore, setValore] = useState(value ?? 0); // Valore da 0 a 100

    useEffect(() => {
        setValore(value);
    }, [value]);

    const bgColor = useMemo(() => {

        return color ?? toCssColor(ThemeColor.PRIMARY);

    }, [color]);

    return (
        <div className='position-relative'>
            <span title={`${valore}%`} className='position-absolute small custom-gradient-bar-initvalue'>{valore}%</span>
            <PB
                now={valore}
                className="custom-gradient-bar no-select"
                title={`${valore}%`}
                label={`${valore}%`}
                style={{ '--pb-color': bgColor, '--pb-value': value / 100 } as React.CSSProperties}
            />
        </div>

    );
};