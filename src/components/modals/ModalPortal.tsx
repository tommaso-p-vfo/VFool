import { createPortal } from 'react-dom';

export const ModalPortal = ({ elementDOMId, children }) => {
  // Seleziona l'elemento target nel DOM
  const modalRoot = document.getElementById(elementDOMId);
  
  // Se l'elemento non esiste (opzionale), puoi decidere di non renderizzare o loggare un errore
  if (!modalRoot) return children; 

  return createPortal(children, modalRoot);
};