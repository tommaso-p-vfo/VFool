import { useEffect, useState } from "react";
import { FaEllipsisH } from "react-icons/fa";

/**
 * 
 * Usa questo componente per mostrare un LoadingOverlay comune all'interno dei singoli componenti
 * Per funzionare ha bisogno di avere un contenitore con CSS position 'relative'
 * In React può essere abilitato attraverso un booleano useState setLoading(true|false) impostato a livello di singolo componente
 * 
 * @param variant - primary o secondary, sulla falsa riga delle opzioni React di stilizzazione
 * @returns 
 */

const LoadingOverlay = ({ variant }: { variant?: string }) => {

    const [bg, setBg] = useState('trasparent');
    const [color, setColor] = useState('black');
    const [blur, setBlur] = useState('2px');
    const [text, setText] = useState('Caricamento dati...');


    useEffect(() => {
        switch (variant) {

            case 'primary':
                setBg('var(--ids-primary-contrast)');
                setColor('var(--primary) !important');
                break;

            case 'primary-opacity':
                setBg('var(--ids-contrast-50)');
                setColor('var(--primary) !important');
                setBlur('0px');
                setText('');
                break;

            case 'secondary':
                setBg('var(--secondary)');
                setColor('var(--ids-primary-contrast) !important');
                break;

            case 'transparent':
                setBg('transparent');
                setColor('var(--primary) !important');
                setBlur('3px');
                setText('');
                break;

            default:
                variant = ''
        }

    }, [variant]);



    return (
        <div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: bg,
                backdropFilter: `blur(${blur})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2
            }}
        >
            <div className="d-flex flex-column align-items-center">
                <div className="ids-spinner">
                    <span>
                        <FaEllipsisH style={{ width: '2rem', height: '2rem', color: color }} />
                    </span>
                </div>
                {/* <div
                    className="spinner-border"
                    role="status"
                    style={{ width: '3rem', height: '3rem', color:color }}
                >
                    <span className="visually-hidden">Caricamento...</span>
                </div> */}
                <div className="mt-3 text-muted">{text}</div>
            </div>
        </div>
    );
}

export default LoadingOverlay;