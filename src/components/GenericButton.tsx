import { CSSProperties, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Button } from "react-bootstrap";

//TODO fix IdsVariant
// import { IdsVariant } from "../../types/system/IdsVariant";

import { InfoButton } from "./InfoButton";
import { getContrastColor, ThemeColor, ThemeColorName, ThemeVariant, ThemeVariantName, toCssColor } from "../utils";
import { useStyler } from "../contexts/styler/StylerContext";
import { isNullEmptyOrUndefined } from "../utils/Guards";

const CSS = `
/* GENERIC BUTTON */
:where(.vfo-btn) {
    border-radius: 5px;
}

button.vfo-btn {
    color: var(--vfo-color);
    background-color: var(--vfo-bg);
    border-color: var(--vfo-bg);
    transition: background-color .15s, color .15s;

    &.active {
        /* filter: brightness(1.2); // schiarisce del 20% */
    }
}

.vfo-btn.filled:hover:not(:disabled) {
    color: var(--vfo-color);
    background-color: color-mix(in srgb, var(--vfo-bg) 75%, transparent);
    border-color: var(--vfo-bg);
}

.vfo-btn.outlined:not(.no-border) {
    border-color: var(--vfo-color);
}

.vfo-btn.outlined:hover:not(:disabled) {
    color: var(--vfo-bg);
    background-color: var(--vfo-color);
}

.vfo-btn.outlined:hover:not(:disabled):not(.no-border) {
    border-color: var(--vfo-bg);
}

`;

//TODO. generic button - indaga 'deleteButton'; //deleteButton - permette di interagire con l'azione di cancellazione dell'item che è inclusa di default nella combobox opion - es. permette di disabilitare il pulsante di cancellazione se l'item è in stato "vinto" (isWon) 
export type GenericButtonProps = { 
    type: 'button' | 'checkbox' | 'switch';
    icon?: ReactElement; //icona da associare alla checkbox
    variant?: ThemeVariantName;
    color?: ThemeColorName;
    backgroundColor?: ThemeColorName;
    
    label?: string;
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

    maxWidth?: number; //larghezza di tutto il componente
    size?: 'small'|'regular'; //
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
    label, 
    tooltip, 

    icon,

    color,
    backgroundColor,
    variant,

    data, 
    disabled, 
    hide, 
    checkboxConfig, 
    buttonConfig, 
    className, 
    infoButtonConfig,
    
    customContent,
    showAsIcon,
    shrinkable,
    maxWidth
    
  } = props;

    const styler = useStyler();

    const _hide = useMemo<boolean>(() => {
        return hide ? hide(data) : false;
    }, [hide, data]);

    const _disabled = useMemo<boolean>(() => {
        return disabled ? disabled(data) : false;
    }, [disabled, data]);

    const _variant = useMemo<string>(() => {
        return variant ?? ThemeVariant.FILLED;
    }, [variant]);

    const _color = useMemo<string>(() => {
        const _c = color ? toCssColor(color) : toCssColor(ThemeColor.PRIMARY);

        if (!_variant || _variant === ThemeVariant.FILLED) {
            return getContrastColor(_c, styler.contrastOptions);
        } else { //outlined
            return _c;
        }
    }, [color, _variant]);

    const _bgColor = useMemo<string>(() => {

        const _bgc = backgroundColor ? toCssColor(backgroundColor) : null;
        
        if (!_variant || _variant === ThemeVariant.FILLED) {
            return _bgc ?? getContrastColor(_color, styler.contrastOptions);
        } else { //outlined
            return _bgc ?? getContrastColor(_color, styler.contrastOptions); 
        }
    }, [_color, backgroundColor, _variant]);

    // Soglia: larghezza minima per mostrare il testo (in px)
    const LABEL_MIN_WIDTH = 150;

    const btnRef = useRef<HTMLButtonElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const hasLabel = !isNullEmptyOrUndefined(label);
    const canShrink = (shrinkable ?? true) && !showAsIcon && hasLabel;

    const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
    const [showLabel, setShowLabel] = useState<boolean>(!showAsIcon && hasLabel);

    // 1. Quando cambia il contenuto: azzera la misura e mostra tutto
    useLayoutEffect(() => {
        setNaturalWidth(null);
        setShowLabel(!showAsIcon && hasLabel);
    }, [label, icon, showAsIcon, hasLabel]);

    // 2. Misura la larghezza naturale (wrapper ancora "auto"), prima del paint
    useLayoutEffect(() => {
        if (naturalWidth !== null || !btnRef.current) return;
        setNaturalWidth(Math.ceil(btnRef.current.getBoundingClientRect().width));
    }, [naturalWidth]);

    // 3. Osserva il wrapper, la cui larghezza ora NON dipende da showLabel
    useEffect(() => {
        const el = wrapperRef.current;
        if (!canShrink || naturalWidth === null || !el) return;

        const ro = new ResizeObserver(([entry]) => {
            setShowLabel(entry.contentRect.width >= naturalWidth - 1); // tolleranza subpixel
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [canShrink, naturalWidth]);

    const wrapperStyle: CSSProperties | undefined =
        canShrink && naturalWidth !== null
            ? { width: naturalWidth, maxWidth: '100%', minWidth: 0 }
            : undefined;

    return (<>
        <style href="vfo-generic-button" precedence="default" style={wrapperStyle}>
            {CSS}
        </style>
        <div ref={wrapperRef} className="d-flex">
            {infoButtonConfig &&
                <InfoButton
                    htmlContent={infoButtonConfig.htmlContent}
                    placement='right-end'
                    className='mb-3 position-absolute top-0 vfo-right-10'
                    tooltip={infoButtonConfig.tooltip ?? ''}
                />
            }

            <Button
                ref={btnRef}
                type={type}
                title={tooltip}
                onClick={onClick}
                disabled={_disabled}
                hidden={_hide}
                className={`vfo-btn cursor-pointer ${_variant.toLocaleLowerCase()} ${className}`}
                style={{
                    '--vfo-color': _color,
                    '--vfo-bg': _bgColor,
                    maxHeight: 50,
                    minWidth: 0,
                    maxWidth: '100%'
                } as CSSProperties}
            >
                <span className="flex-shrink-0">{icon}</span>
                {showLabel && (
                    <span className="ms-1 text-truncate">{label}</span>
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