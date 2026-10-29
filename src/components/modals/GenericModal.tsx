import React, { CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactElement } from 'react';
import { Modal, Button, Container } from 'react-bootstrap';
import LoadingOverlay from '../../utils/components/LoadingOverlay';
import { toCssColor } from '../../utils/Color';

// Definisci il tipo per l'handle esposto
export interface GenericModalHandle {
    hasChanged: () => boolean;
    close: () => boolean;
}

export type ActionFuncProps = {
    data: any;
    componentRef?: React.RefObject<any>;
    closeFunc?: () => void;
}

export interface GenericModalProps {
    icon?: ReactElement;
    title: string;
    children: React.ReactNode;
    actions?: Array<{
        name: string;
        onClick: (data: any, closeFunc?: (() => void)) => void | Promise<void>;
    }>;
    childrenRef?: React.RefObject<any>;
    shouldOpenModal: boolean;
    onCloseModal: () => void;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const GenericModal = forwardRef<GenericModalHandle, GenericModalProps>((props, ref) => {
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
        <Modal show={openModal} onHide={close} size={size ?? 'lg'} style={{ maxHeight: '90vh' }} className={`vfo-modal ${className}`}>
            <Modal.Header closeButton>
                <Modal.Title><span className='me-1'>{icon}</span>{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isLoading && <LoadingOverlay variant={"primary-opacity"} />}
                {children}
            </Modal.Body>
            {actions && (
                <Modal.Footer>
                    <Container fluid className='d-flex mx-4 align-items-center justify-content-end'>
                        {actions.map((action, idx) => (
                            <Button
                                key={idx}
                                className='ms-3'
                                disabled={isLoading}
                                onClick={() => actionClick(action.onClick)}
                            >
                                {action.name}
                            </Button>
                        ))}
                    </Container>
                </Modal.Footer>
            )}
        </Modal>
    );
});

GenericModal.displayName = 'GenericModal';