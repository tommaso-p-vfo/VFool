import { GridApi } from "ag-grid-community";
import type { TableMetadata } from "./TableMetadata";
import { TableContextHandler } from "../contexts/TableContext";

/**
 * Interfaccia per definire gli attributi di una tabella attraverso React
 * Questa interfaccia è generica e può essere utilizzata per qualsiasi tipo di tabella,
 * specificando il tipo degli oggetti contenuti nella tabella.
 * 
 * @template T - Il tipo degli oggetti contenuti nella tabella.
 * @property {TableMetadata} metadata - Metadati della tabella, come il nome della tabella, le traduzioni delle colonne e gli eventi associati.     
 * 
 */
export interface TableAttributes<T> {
    serviceLocator: any;
    metadata: TableMetadata<T>;
}


export type TableHandler = {
    context: TableContextHandler | null;
}