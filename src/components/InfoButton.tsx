import { useRef, useState, type ReactElement } from "react";
import { FaInfoCircle } from "react-icons/fa";

import { Overlay, Popover } from "react-bootstrap";
import type { Placement } from "react-bootstrap/esm/types";
import { ThemeColor, toCssColor } from "../utils";

export const InfoButton = ({ htmlContent, tooltip, placement, className, size }: { htmlContent: any, tooltip?: string, placement?: Placement, className?: string, size?: number }) => {

    const [show, setShow] = useState(false);
    const target = useRef(null);

    const defaultColor = toCssColor(ThemeColor.PRIMARY);

    return (
        <>
            <span ref={target} style={{ display: 'flex', alignItems: 'center' }} className={className}>
                <FaInfoCircle
                    title={tooltip ?? 'Informazioni'}
                    size={size ?? 15}
                    color={defaultColor}
                    className='cursor-pointer'
                    onClick={() => { setShow(!show); }} />
            </span>
            <Overlay
                target={target.current}
                show={show}
                placement={placement ?? "bottom-start"}
                rootClose
                onHide={() => setShow(false)}
                flip={true}
                popperConfig={{
                    modifiers: [
                        {
                            name: 'preventOverflow',
                            options: {
                                boundary: 'viewport',
                                padding: 8,
                            },
                        },
                        {
                            name: 'flip',
                            options: {
                                fallbackPlacements: ['top-start', 'bottom-end', 'top-end', 'left', 'right'],
                            },
                        },
                    ],
                }}
            >
                <Popover
                    style={{
                        minWidth: 300,
                        maxWidth: 400,
                        boxShadow: `${toCssColor(ThemeColor.GRAY)} 2px 3px 10px`
                    }}
                >
                    <Popover.Body style={{ maxHeight: '70vh', overflowY: 'auto' }} className="d-flex">
                        <span className="pe-1">
                            <FaInfoCircle size={20} color={defaultColor} />
                        </span>
                        <span>
                            {htmlContent ?? <span>Nessun contenuto.</span>}
                        </span>
                    </Popover.Body>
                </Popover>
            </Overlay>
        </>
    );
}