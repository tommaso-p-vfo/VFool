import { ReactNode } from "react"

/**
 *  
 *  Interfaccia per ottenere componenti dinamicamente.
 *  Lista di chiavi associate a un componente.
 * 
 *  @remarks un componente dovrebbe essere in forwardRef e avere un handler con le sue azioni.
 * 
 *  @example
 *  ```
 *  la chiave potrebbe essere un DOMAIN.SUBDOMAIN.ACTION_TYPE. 
 *
 *  es. Tenders.Statuses.ADD
 *  il componente dovrebbe avere un componentRef.current.add() action.
 * 
 *  ```
 * 
 *  @returns il componente associato alla chiave.
 * 
 */
export type IComponentRegistry = {
    [key: string]: ReactNode;
}