import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "react-bootstrap";

//TODO fix IdsVariant
// import { IdsVariant } from "../../types/system/IdsVariant";

import { InfoButton } from "./InfoButton";
import { toCssColor } from "../utils";

export type GenericButtonProps = { 
    type: 'button' | 'checkbox' | 'deleteButton'; //deleteButton - permette di interagire con l'azione di cancellazione dell'item che è inclusa di default nella combobox opion - es. permette di disabilitare il pulsante di cancellazione se l'item è in stato "vinto" (isWon)
    readableName: string;
    onClick: (event?: any) => void;
    children?: ReactNode;
    tooltip?: string;
    className?: string; hidden?: boolean;
    disabled?: boolean | ((data: any) => boolean); //deleteButton type - usa una funzione per disabilitare il pulsante in base allo stato dell'item (es. isWon)
    buttonConfig?: GenericButtonConfig;
    checkboxConfig?: GenericCheckboxConfig; 

}

export type GenericCheckboxConfig = {
    field: string; //campo della entity a cui fare riferimento per il value della checkbox
    icon?: ReactElement; //icona da associare alla checkbox
    readonly?: boolean; //disponibile in sola lettura - default false
    useIconToCheck?: boolean; //sostituisce il flag della checkbox con l'icona (icon)
}

export type GenericButtonConfig = {

    variant?: string; //IdsVariant
    backgroundColor?: string; //IdsColor
    color?: string; //IdsColor
    borderColor?: string; //IdsColor
    icon?: ReactElement;
    subIcon?: ReactElement; //icona secondaria opzionale,
    infoButtonConfig?: { //aggiunge il bottone di info al componente
        htmlContent: any[];
        tooltip: string;
    }; 
    shrink?: boolean; //versione contratta del bottone, il name diventa tooltip e viene mostrata solo l'icona - default false

}

export const GenericButton = ({ readableName, onClick, children, tooltip, className, hidden, disabled, buttonConfig }: GenericButtonProps) => {

    const [colorClass, setColorClass] = useState<string>('primary');
    const [bgColor, setBgColor] = useState<string>('var(--primary)');
    const [color, setColor] = useState<string>('var(--primary-contrast)');
    const [borderColor, setBorderColor] = useState<string>('var(--primary-contrast)');
    const [variant, setVariant] = useState<string>('');
    
    const shrink = buttonConfig?.shrink ?? false;
    // Soglia: larghezza minima per mostrare il testo (in px)
    const LABEL_MIN_WIDTH = 150;
    const btnRef = useRef<HTMLButtonElement>(null);
    const [showLabel, setShowLabel] = useState(false);

    useEffect(() => {
    if (!btnRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
        setShowLabel(entry.contentRect.width >= LABEL_MIN_WIDTH);
    });

    observer.observe(btnRef.current);
    return () => observer.disconnect();
    }, []);
    
    useEffect(() => {
        
        // setVariant(buttonConfig?.variant ? buttonConfig?.variant == IdsVariant.DARK ? 'ids-btn-dark' : 'ids-btn-light' : '');
        if (buttonConfig?.backgroundColor) {
            let colorObj = toCssColor(buttonConfig?.backgroundColor);
            setBgColor(colorObj);
        }
        
        if (buttonConfig?.color) {
            
            let colorObj = toCssColor(buttonConfig?.color);
            
            setColorClass(buttonConfig?.color);
            setColor(colorObj);
        }
        
        if(buttonConfig?.borderColor) {
            let colorObj = toCssColor(buttonConfig?.borderColor);
            setBorderColor(colorObj);
        } else if (buttonConfig?.color) {
            let colorObj = toCssColor(buttonConfig?.color);
            setBorderColor(colorObj);
        }

    }, [buttonConfig]);

    return (<>
    
        {buttonConfig && buttonConfig?.infoButtonConfig &&
            <InfoButton
                htmlContent={buttonConfig?.infoButtonConfig.htmlContent}
                placement='right-end'
                className='mb-3 position-absolute top-0 ids-right-10'
                tooltip={buttonConfig?.infoButtonConfig.tooltip ?? ''}
            />
        }

        {buttonConfig && !shrink && 
            <Button 
                title={tooltip} 
                onClick={onClick} 
                disabled={disabled} 
                className={`cursor-pointer ids-btn mx-1 ${variant} ${colorClass} ${className}`} 
                hidden={hidden} 
                style={{ color: color, backgroundColor: bgColor, borderColor: borderColor }}
            >
                
                <div className="d-flex align-items-center align-content-center justify-content-center">
                    <span className={`${children ? 'me-1' : ''}`}>
                        
                        {!buttonConfig.subIcon && buttonConfig.icon}

                        {buttonConfig.subIcon && 
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                {buttonConfig.icon}
                                <span style={{
                                position: 'absolute',
                                bottom: -2,
                                right: -4,
                                fontSize: '0.6em'
                            }}>
                                    {buttonConfig.subIcon}
                                </span>
                            </div>
                        }                        
                    </span>
                    {children}
                </div>
            </Button>
        }

        {buttonConfig && shrink && 
        <div className="w-100">
            <Button
                title={tooltip}
                onClick={onClick}
                disabled={disabled}
                hidden={hidden}
                className={`cursor-pointer ids-btn p-1 pb-2 d-flex align-items-center justify-content-center w-100 overflow-hidden ${variant} ${colorClass} ${className}`}
                style={{ color, backgroundColor: bgColor, borderColor: borderColor, maxHeight: 50 }}
                ref={btnRef}
            >
                <span className="flex-shrink-0">{buttonConfig.icon}</span>
                {showLabel && (
                <span className="ms-1 text-truncate">{tooltip}</span>
                )}
            </Button>
            </div>
        }

        {!buttonConfig &&
            <Button title={tooltip} onClick={onClick} disabled={disabled} className={className} hidden={hidden}>{children}</Button>
        }
        </>
    );

}