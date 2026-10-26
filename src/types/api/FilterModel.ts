import type { AgGridFilterType } from "../../../ui/common/tables/constants/agGridConstants";

export enum FilterTypeField {
    TEXT = 'text',
    NUMBER = 'number',
    DATE = 'date'
}

export type FilterTypeFieldType = `${FilterTypeField}`;

export type FilterModel = {

    [columnName:string]: {
        filterType: FilterTypeFieldType; //text | number | ecc.
        
        // valore e tipo da filtrare
        // usare quando 'operator' è undefined
        type?: AgGridFilterType; //AG_GRID_FILTER_TYPE
        filter?: any; 

        //FILTRO PER DATE - da usare in alternativa a 'filter' per gestire i range di date
        dateTo?: string; //usato per i filtri di tipo date, rappresenta la data di fine del filtro
        dateFrom?: string; //usato per i filtri di tipo date, rappresenta la data di inizio del filtro
        
        operator?: 'AND' | 'OR';
        //da popolare quando operator è impostato
        conditions?: [
            {
                filterType: FilterTypeFieldType; //text | number | ecc.
                type: AgGridFilterType; //AG_GRID_FILTER_TYPE
                filter: any; //valore da filtrare
            }
        ];
        
        // filterColId - guida uso del campo
        // campo custom
        // da usare quando si fa la chiamata nella configurazione di un GenericForm
        // e la posizione del dato da passare al filter è diversa dal columnName del filterModel
        // questo succede ad esempio con i dati annidati
        //
        /*
            es. con dati annidati
            voglio filtrare per id 
            dunque creerò nella config del Form...
            
            filterData : { 
                id: {
                    filterType: FilterTypeField.NUMBER,
                    type: AG_GRID_FILTER_TYPE.NOT_EQUAL,
                    filter: ??
                } 
            } as FilterModel;

            come si nota, manca il set del campo filter
            questo perchè esso deve contentere il dato da filtrare
            in questo esempio sarà un id da escludere dalla ricerca (NON EQUALS)
            ma nella configurazione del form non è ancora disponibile
            deve essere demandata l'assegnazione al GenericForm

            Il comportamento di default del GenericForm prevede la ricerca del dato columnName.
            Questo comportamento funziona nella magggior parte dei casi, quando si lavora sulle singole entità 

            Se però l'oggetto con cui lavora il GenericForm è un oggetto custom, ed esso contiene un insieme di entità
            
            es. dati annidati
            data = {
                agents: { id: ...},
                hierarchy: { id: ...}
            }

            il GenericForm andrà a cercare dentro data[columnName] => data[id] => undefined.

            Per ovviare al problema viene incontro il campo filterColId che prende il path della property
            e sovrascrive il comportamento di default di GenericForm
            Se ad esempio sto filtrando per agente, avrò:

             filterData : { 
                id: {
                    filterType: FilterTypeField.NUMBER,
                    type: AG_GRID_FILTER_TYPE.NOT_EQUAL
                    filterColId: 'agent.id'
                } 
            } as FilterModel;

        */
        filterColId?: string; 
    }


}