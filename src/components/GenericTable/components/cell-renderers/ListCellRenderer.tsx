import { useState, useEffect, useRef } from 'react';
import { UiHelper } from '../../../../../core/helpers/UiHelper';
import { IdsColor } from '../../../../../types/system/IdsColor';
import useTranslations from '../../../../../locales/hooks/useTranslations';
import { FaCheck } from 'react-icons/fa';
import { COL_EMPTY_PLACEHOLDER } from '../../constants/tableConstants';
import TooltipComponent from '../../../TooltipComponent';
import { Overlay, Popover } from 'react-bootstrap';

export type ListCellRendererProps = {
    data: [];
    colId: number;
    field: string; //campo dell'oggetto da visualizzare, se non specificato visualizza l'intero oggetto
    defaultColor?: string;
    className?: string;
    maxVisible?: number;
}

/**
 * Cell Renderer
 * 
 * @param props 
 * @returns 
 */
const ListCellRenderer: React.FC<ListCellRendererProps> = ({
    data,
    colId,
    field,
    defaultColor,
    className,
    maxVisible = 3,
}: ListCellRendererProps) => {

    const target = useRef(null);
    const [color, setColor] = useState<string>(defaultColor ?? IdsColor.PRIMARY);
    const [expanded, setExpanded] = useState<boolean>(false);

    const items: string[] = Array.isArray(data?.[colId]) ? data[colId] : [];
    const isEmpty = items.length === 0;
    const hasMore = items.length > maxVisible;
    const visibleItems = items.slice(0, maxVisible);

    useEffect(() => {
        if (!data) return;

        let _color = defaultColor ?? IdsColor.PRIMARY;
        let _bgColor = UiHelper.getColor(_color);
        setColor(_bgColor.color);
    }, [data]);

    return (
        // Wrapper esterno: due colonne flex, altezza piena del genitore
        <div
            className="d-flex w-100 h-100"
            style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center' }}
        >
            {/* Colonna sinistra: i chip. Va a capo (flexWrap) e scrolla in verticale se non ci sta */}
            <div className='ids-cell-renderer-list-container'
                style={{
                    flex: '1 1 auto',
                    minWidth: 0,
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignContent: 'flex-center',
                    alignItems: 'flex-center',
                    gap: '4px',
                    padding: '2px 0',
                    maxHeight: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}
            >
                {isEmpty && (
                    <span
                        className={`${className}`}
                        style={{
                            // color: color,
                            // border: `1px solid ${color}`,
                            // borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '1.4',
                            flexShrink: 0

                        }}
                    >{COL_EMPTY_PLACEHOLDER}</span>
                )}

                {!isEmpty && visibleItems.map((item, index) => (
                    <span
                        key={index}
                        className={`${className} ids-text-truncate`}
                        title={field ? item[field] : ''}
                        style={{
                            color: color,
                            border: `1px solid ${color}`,
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '1.4',
                            flexShrink: 0
                            
                        }}
                    >
                        {field ? item[field] : ''}
                    </span>
                ))}
            </div>

            {/* Colonna destra: fissa, non va mai a capo -> + e - restano sempre incolonnati qui */}
            {!isEmpty && hasMore && (
                <div
                    style={{
                        flex: '0 0 auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingLeft: '4px',
                    }}
                >
                    {/* {!expanded ? ( */}

            <span
                ref={target} 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setExpanded(true); 
                }}
                style={{
                    cursor: 'pointer',
                    color: color,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    padding: '1px 4px',
                    userSelect: 'none',
                }}
            >
                +{items.length - maxVisible}
            </span>
        <Overlay
            target={target.current}
            show={expanded} 
            placement="bottom-end"
            rootClose
            onHide={() => setExpanded(false)}
        >

            <Popover 
                className='no-arrow'
                style={{
                    minWidth: 300,
                    maxWidth: 400,
                    boxShadow: `${UiHelper.getColor(IdsColor.GRAY).color} 2px 3px 10px`
                }}
            >
            
            
                            <Popover.Body style={{ maxHeight: '70vh', overflowY: 'auto' }} className='ids-cell-renderer-list-container'>
                    

                {items.map((item, index) => (
                    <span
                        key={index}
                        className={`${className} ids-text-truncate`}
                        title={field ? item[field] : ''}
                        style={{
                            color: color,
                            border: `1px solid ${color}`,
                            borderRadius: '4px',
                            padding: '1px 6px',
                            fontSize: '0.75rem',
                            whiteSpace: 'nowrap',
                            lineHeight: '1.4',
                            flexShrink: 0,
                            marginRight: 2
                            
                        }}
                    >
                        {field ? item[field] : ''}
                    </span>
                ))}

                </Popover.Body>
            </Popover>
        </Overlay>


                    
                    
                    
                </div>
            )}

                
                            
           
        </div>
    );
}

export default ListCellRenderer;