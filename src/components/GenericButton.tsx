import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "react-bootstrap";

//TODO fix IdsVariant
// import { IdsVariant } from "../../types/system/IdsVariant";

import { InfoButton } from "./InfoButton";
import { toCssColor } from "../utils";

const CSS = `
/* GENERIC BUTTON */
:where(.vfo-btn) {

  border-radius: 5px;

  &.active {
    filter: brightness(1.2); // schiarisce del 20%
  }

  &:hover {
    filter: brightness(1.1);
  }
}

:where(.vfo-btn-dark) {
  &.vfo-btn-radio {
    background-color: $primary !important;
    color: $white !important;
    border: 1px solid $primary !important;
  }
}

:where(.vfo-btn-light) {
    background-color: $vfo-contrast-70 !important;
    border: 1px solid;

    &.primary-contrast {
      &:hover {
        background-color: var(--vfo-primary-contrast) !important;
        color: var(--primary) !important;
      }
      color: var(--vfo-primary-contrast) !important;
      // border-color: var(--vfo-primary-contrast) !important;
    }

    &.primary {
      &:hover {
        background-color: var(--primary) !important;
        color: var(--vfo-primary-contrast) !important;
      }
      color: var(--primary) !important;
      // border-color: var(--primary) !important;
    }

    &.secondary {
      &:hover {
        background-color: var(--secondary) !important;
        color: $white !important;
      }
      color: var(--secondary) !important;
      // border-color: var(--secondary) !important;
    }

    &.vfo-red {
      &:hover {
        background-color: var(--vfo-red) !important;
        color: white !important;
      }
      color: var(--vfo-red) !important;
      // border-color: var(--vfo-red) !important;
    }

    &.vfo-gray {
      &:hover {
        background-color: var(--vfo-gray) !important;
        color: white !important;
      }
      color: var(--vfo-gray) !important;
      // border-color: var(--vfo-gray) !important;
    }

    &.vfo-green {
      &:hover {
        background-color: var(--vfo-green) !important;
        color: white !important;
      }
      color: var(--vfo-green) !important;
      // border-color: var(--vfo-green) !important;
    }

    &.vfo-blue {
      &:hover {
        background-color: var(--vfo-blue) !important;
        color: white !important;
      }
      color: var(--vfo-blue) !important;
      // border-color: var(--vfo-blue) !important;
    }

    &.vfo-light-gray {
      &:hover {
        background-color: var(--vfo-light-gray) !important;
        color: white !important;
      }
      color: var(--vfo-light-gray) !important;
      // border-color: var(--vfo-light-gray) !important;
    }

    &.vfo-light-blue {
      &:hover {
        background-color: var(--vfo-light-blue) !important;
        color: white !important;
      }
      color: var(--vfo-light-blue) !important;
      // border-color: var(--vfo-light-blue) !important;
    }

    &.vfo-orange {
      &:hover {
        background-color: var(--vfo-orange) !important;
        color: white !important;
      }
      color: var(--vfo-orange) !important;
      // border-color: var(--vfo-orange) !important;
    }

    &.vfo-yellow {
      &:hover {
        background-color: var(--vfo-yellow) !important;
        color: white !important;
      }
      color: var(--vfo-yellow) !important;
      // border-color: var(--vfo-yellow) !important;
    }

}
`;

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
        
        // setVariant(buttonConfig?.variant ? buttonConfig?.variant == IdsVariant.DARK ? 'vfo-btn-dark' : 'vfo-btn-light' : '');
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
        <style href="vfo-generic-button" precedence="default">
            {CSS}
        </style>
        {buttonConfig && buttonConfig?.infoButtonConfig &&
            <InfoButton
                htmlContent={buttonConfig?.infoButtonConfig.htmlContent}
                placement='right-end'
                className='mb-3 position-absolute top-0 vfo-right-10'
                tooltip={buttonConfig?.infoButtonConfig.tooltip ?? ''}
            />
        }

        {buttonConfig && !shrink && 
            <Button 
                title={tooltip} 
                onClick={onClick} 
                disabled={disabled} 
                className={`cursor-pointer vfo-btn mx-1 ${variant} ${colorClass} ${className}`} 
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
                className={`cursor-pointer vfo-btn p-1 pb-2 d-flex align-items-center justify-content-center w-100 overflow-hidden ${variant} ${colorClass} ${className}`}
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