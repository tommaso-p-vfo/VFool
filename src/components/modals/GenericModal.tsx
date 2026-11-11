import React, { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactElement } from 'react';
import { Modal, Button, Container } from 'react-bootstrap';
import { LoadingOverlay } from '../LoadingOverlay';
import { toCssColor } from '../../utils/Color';
import { GenericButton, GenericButtonConfig, GenericButtonProps } from '../GenericButton';

// Definisci il tipo per l'handle esposto
export interface GenericModalHandler {
    hasChanged: () => boolean;
    close: () => boolean;
}

export type ActionFuncProps = {
    data: any;
    componentRef?: React.RefObject<any>;
    closeFunc?: () => void;
}

export type GenericModalActionConfig = GenericButtonProps & {
    // name: string;
    // onClick: (data: any, closeFunc?: (() => void)) => void | Promise<void>;
}

export interface GenericModalProps {
    icon?: ReactElement;
    title: string;
    children: React.ReactNode;
    childrenRef?: React.RefObject<any>;
    actions?: GenericModalActionConfig[];

    shouldOpenModal: boolean;
    onCloseModal: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const GenericModal = forwardRef<GenericModalHandler, GenericModalProps>((props, ref) => {
    const {
        icon,
        title,
        children,
        actions,
        childrenRef,
        shouldOpenModal,
        onCloseModal,
        size,
        className
    } = props;

    const [openModal, setOpenModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const somethingChangedRef = useRef<boolean>(false);

    // Correzione 1: mancavano le parentesi graffe per l'oggetto
    useImperativeHandle(ref, () => ({
        hasChanged: () => somethingChangedRef.current,
        close
    }));

    useEffect(() => {
        setOpenModal(shouldOpenModal);
    }, [shouldOpenModal]);

    const close = () => {
        setIsLoading(false);
        onCloseModal();
    };

    const actionClick = async (actionFunc: (props:ActionFuncProps) => void | Promise<void>) => {
        setIsLoading(true);
        await actionFunc({ data: childrenRef?.current?.data(), componentRef: childrenRef, closeFunc: close});
        setIsLoading(false);
    };

    return (
        <Modal 
            show={openModal} 
            onHide={close} 
            size={size ?? 'lg'} 
            className={`vfo-modal ${className}`}
            scrollable
        >
            <Modal.Header closeButton>
                <Modal.Title><span className='me-1'>{icon}</span>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex flex-column" style={{ minHeight: 0 }} >
                {isLoading && <LoadingOverlay />}
                {children}
            </Modal.Body>
            {actions && (
                <Modal.Footer>
                    <Container fluid className='d-flex mx-4 align-items-center justify-content-end'>
                        {actions.map((action, idx) => (
                            <GenericButton
                                type={action.type}
                                readableName={action.readableName}
                                key={idx}
                                className='ms-3'
                                disabled={isLoading}
                                onClick={() => actionClick(action.onClick)}
                            >
                                {action.readableName}
                            </GenericButton>
                        ))}
                    </Container>
                </Modal.Footer>
            )}
        </Modal>
    );
});

GenericModal.displayName = 'GenericModal';