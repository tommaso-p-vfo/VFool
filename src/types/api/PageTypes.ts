import type { FilterModel } from "./FilterModel";
import type { SortModel } from "./SortModel";

type PageRequest = {
    pageNumber: number; // Numero della pagina corrente
    pageSize: number; // Numero di elementi per pagina
    filter?: FilterModel; // filter[totalActivities]=>[5]&filter[displayOrder]=[1,10] &...
    sort?: SortModel; // sort=name_ASC,displayOrder_ASC, ...
    select?: string[]; //campi di cui richiedere la projection lato backend
    data?: any,
}

type PageResponse<T> = {
    items: T[]; //
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean; 
}

type PagePagination = {
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
}

export type { PageRequest, PageResponse, PagePagination };