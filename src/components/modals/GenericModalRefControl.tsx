import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Modal, Button, Container } from 'react-bootstrap';
import LoadingOverlay from '../../utils/components/LoadingOverlay';

export type ModalAction = {
    name: string;
    onClick: (data: any, closeFunc?: (() => void)) => void | Promise<void>;
}

// Definisci il tipo per l'handle esposto
export type GenericModalRefControlHandle = {
    hasChanged: () => boolean;
    close: () => void;
    setTitle: (val: string) => void;
    setChildren: (val: any) => void;
    setActions: (val: ModalAction[]) => void;
    setChildrenRef: (val: any) => void;
    setShouldOpenModal: (val: any) => void;
    setOnCloseModal: (val: any) => void;
    setSize: (val: any) => void;
    reset: () => void;
}

type GenericModalRefControlProps = {
    title?: string;
    children?: React.ReactNode;
    actions?: ModalAction[];
    childrenRef?: React.RefObject<any>;
    shouldOpenModal?: boolean;
    onCloseModal?: () => void;
    size?: 'sm' | 'lg' | 'xl';
}

export const GenericModalRefControl = forwardRef<GenericModalRefControlHandle, GenericModalRefControlProps>((props, ref) => {
    
    const [title, setTitle] = useState(props.title);
    const [children, setChildren] = useState(props.children);
    const [actions, setActions] = useState(props.actions);
    const [childrenRef, setChildrenRef] = useState(props.childrenRef);
    const [shouldOpenModal, setShouldOpenModal] = useState<boolean>(false);
    const [onCloseModal, setOnCloseModal] = useState(props.onCloseModal);
    const [size, setSize] = useState(props.size);

    const [openModal, setOpenModal] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const somethingChangedRef = useRef<boolean>(false);

    const reset = () => {
        setIsLoading(false);
    }

    // Correzione 1: mancavano le parentesi graffe per l'oggetto
    useImperativeHandle(ref, () => ({
        hasChanged: () => somethingChangedRef.current,
        close,
        setTitle,
        setChildren,
        setActions,
        setChildrenRef,
        setShouldOpenModal,
        setOnCloseModal,
        setSize,
        reset
    }));

    useEffect(() => {
        setOpenModal(shouldOpenModal);
    }, [shouldOpenModal]);

    const close = () => {
        setIsLoading(false);
        // if (onCloseModal && typeof onCloseModal === 'function')
        //     onCloseModal();
        setShouldOpenModal(false);
        
    };

    const actionClick = async (actionFunc: (data: any, closeFunc?: (() => void)) => void | Promise<void>) => {
        setIsLoading(true);
        try {
            await actionFunc(childrenRef?.current?.data(), close);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal show={openModal} onHide={close} size={size ?? 'lg'} style={{ maxHeight: '90vh' }}>
            <Modal.Header closeButton>
                <Modal.Title>{title}</Modal.Title>
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

GenericModalRefControl.displayName = 'GenericModalRefControl';