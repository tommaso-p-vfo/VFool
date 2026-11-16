import { useEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "react-bootstrap";

//TODO fix IdsVariant
// import { IdsVariant } from "../../types/system/IdsVariant";

import { InfoButton } from "./InfoButton";
import { ThemeColor, ThemeColorName, ThemeVariant, ThemeVariantName, toCssColor } from "../utils";

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


`;

//TODO. generic button - indaga 'deleteButton'; //deleteButton - permette di interagire con l'azione di cancellazione dell'item che è inclusa di default nella combobox opion - es. permette di disabilitare il pulsante di cancellazione se l'item è in stato "vinto" (isWon) 
export type GenericButtonProps = { 
    type: 'button' | 'checkbox' | 'switch';
    icon?: ReactElement; //icona da associare alla checkbox
    variant?: ThemeVariantName;
    color?: ThemeColorName;
    backgroundColor?: ThemeColorName;
    
    /** readableName - titolo del bottone visibil nel contenuto */
    readableName: string;
    tooltip?: string;
    
    onClick: (event?: any) => void;
    customContent?: ReactNode;
    className?: string; hidden?: boolean;
    buttonConfig?: GenericButtonConfig;
    checkboxConfig?: GenericCheckboxConfig; 
    
    data?: () => any; //si possono passare dei dati dinamicamente per influenzare il comportamento del bottone
    disabled?: ((data?: unknown) => boolean);
    hide?: ((data?: unknown) => boolean);

    infoButtonConfig?: { //aggiunge il bottone di info al componente
      htmlContent: any[];
      tooltip: string;
    };

    shrinkable?: boolean; //permette al bottone di ridimensionarsi sulla base dello spazio
    showAsIcon?: boolean; //visualizza il bottone come icona
}

export type GenericCheckboxConfig = {
    field: string; //campo della entity a cui fare riferimento per il value della checkbox
    readonly?: boolean; //disponibile in sola lettura - default false
    useIconToCheck?: boolean; //sostituisce il flag della checkbox con l'icona (icon)
}

export type GenericButtonConfig = {

    // backgroundColor?: string; //IdsColor
    // borderColor?: string; //IdsColor
    
    // icon?: ReactElement;
    subIcon?: ReactElement; //icona secondaria opzionale,
    
    // shrink?: boolean; //versione contratta del bottone, il name diventa tooltip e viene mostrata solo l'icona - default false

}

export const GenericButton = (props : GenericButtonProps ) => {

  const { 
    type, 
    onClick, 
    readableName, 
    tooltip, 

    color,
    backgroundColor,
    variant,

    data, 
    disabled, 
    hide, 
    checkboxConfig, 
    buttonConfig, 
    className, 
    infoButtonConfig 
  } = props;

  const _hide = useMemo<boolean>(() => {

    return hide ? hide(data) : false;

  }, [disabled, data]);

  const _disabled = useMemo<boolean>(() => {

    return disabled ? disabled(data) : false;

  }, [disabled, data]);

  const _color = useMemo<string>(() => {
    
    if(!variant || variant === ThemeVariant.FILLED) {
      return backgroundColor ?? 
    } else { //outlined
      return color;
    }


  }, [color, variant]);

    // const [colorClass, setColorClass] = useState<string>('primary');
    // const [bgColor, setBgColor] = useState<string>(toCssColor(ThemeColor.PRIMARY));
    // const [color, setColor] = useState<string>(toCssColor(ThemeColor.PRIMARY_CONTRAST));
    // const [borderColor, setBorderColor] = useState<string>(toCssColor(ThemeColor.PRIMARY_CONTRAST));
        
    // const shrink = buttonConfig?.shrink ?? false;
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
    
    // useEffect(() => {
        
    //     // setVariant(buttonConfig?.variant ? buttonConfig?.variant == IdsVariant.DARK ? 'vfo-btn-dark' : 'vfo-btn-light' : '');
    //     if (buttonConfig?.backgroundColor) {
    //         let colorObj = toCssColor(buttonConfig?.backgroundColor);
    //         setBgColor(colorObj);
    //     }
        
    //     if (buttonConfig?.color) {
            
    //         let colorObj = toCssColor(buttonConfig?.color);
            
    //         // setColorClass(buttonConfig?.color);
    //         setColor(colorObj);
    //     }
        
    //     if(buttonConfig?.borderColor) {
    //         let colorObj = toCssColor(buttonConfig?.borderColor);
    //         setBorderColor(colorObj);
    //     } else if (buttonConfig?.color) {
    //         let colorObj = toCssColor(buttonConfig?.color);
    //         setBorderColor(colorObj);
    //     }

    // }, [buttonConfig]);

    return (<>
        <style href="vfo-generic-button" precedence="default">
            {CSS}
        </style>
        {buttonConfig && infoButtonConfig &&
            <InfoButton
                htmlContent={infoButtonConfig.htmlContent}
                placement='right-end'
                className='mb-3 position-absolute top-0 vfo-right-10'
                tooltip={infoButtonConfig.tooltip ?? ''}
            />
        }


      {/* // p-1 pb-2 d-flex align-items-center justify-content-center w-100 overflow-hidden */}
         <div className="w-100">
        
            <Button
                type={type}
                title={tooltip}
                onClick={onClick}
                disabled={_disabled}
                hidden={_hide}
                className={`vfo-btn cursor-pointer ${variant} ${className}`}
                style={{ color, backgroundColor: bgColor, borderColor: borderColor, maxHeight: 50 }}
                ref={btnRef}
            >
                <span className="flex-shrink-0">{buttonConfig?.icon}</span>
                {showLabel && (
                    <span className="ms-1 text-truncate">{tooltip}</span>
                )}
            </Button>
            </div>
        

        {/* {buttonConfig && !shrink && 
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
        } */}

        {/* {buttonConfig && shrink && 
       

        {!buttonConfig &&
            <Button 
              ref={btnRef}
              title={tooltip} 
              onClick={onClick} 
              disabled={disabled} 
              className={className} 
              hidden={hidden}>
                {children}
            </Button>
        } */}
        </>
    );

}