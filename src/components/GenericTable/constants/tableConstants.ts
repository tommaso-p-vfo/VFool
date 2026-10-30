export const DEFAULT_COLUMN_FILTER = true; //determina se il filtro (filtro avanzato colonna) è da abilitare di default
export const DEFAULT_COLUMN_SORTABLE = true; //determina se il filtro (sortable) è da abilitare di default

export const COL_MIN_WIDTH = 100;
export const COL_EMPTY_PLACEHOLDER = '-';

//usato da inifite row model per il precaricamento dei dati in cache
export const AG_GRID_ROW_BLOCK_SIZE = 50;

export const AG_GRID_PAGE_SIZE_SELECTOR = [5, 10, 20, 50, 100];
export const AG_GRID_PAGE_SIZE = {
    _5: 5,
    _10: 10,
    _20: 20,
    _50: 50,
    _100: 100,
}
export const AG_GRID_DEFAULT_PAGE_SIZE = 20;

export type AgGridColumnType = typeof AG_GRID_COLUMN_TYPE[keyof typeof AG_GRID_COLUMN_TYPE];

export const AG_GRID_COLUMN_TYPE = {
    AG_GRID_TEXT: "agTextColumnFilter", //AG GRID FILTER - THIS VALUE CAN'T CHANGE
    AG_GRID_NUMBER: "agNumberColumnFilter", //AG GRID FILTER - THIS VALUE CAN'T CHANGE
    AG_GRID_DATE: "agDateColumnFilter", //AG GRID FILTER - THIS VALUE CAN'T CHANGE
    AG_GRID_SET: "agSetColumnFilter", //AG GRID FILTER - THIS VALUE CAN'T CHANGE
    ACTIONS: "hdsActionsColumnType", //custom - colonna azioni
    BOOLEAN: "hdsBooleanColumnType", //custom
    COLOR: "hdsColorColumnType", //custom
    BOXED_TEXT: "hdsBoxedTextColumnType", //custom
    BOXED_NUMBER: "hdsBoxedNumberColumnType", //custom
    HIGHLIGHTED_TEXT: "hdsHighlightedTextColumnType", //custom
    EMPHASIZED_TEXT: "hdsEmphasisedTextColumnType", //custom
    CURRENCY_NUMBER: "hdsCurrencyNumberColumnType", //custom
    COUNTABILITY_NUMBER: "hdsCountabilityNumberColumnType", //custom
    PROGRESS_BAR: "hdsProgressBarColumnType", //custom,
    BOXED_COMBOBOX: "hdsBoxedCombobox", //custom
    LIST: "hdsList", //custom
}

export const AG_GRID_FILTER_TYPE = {
    // ===== TEXT FILTER TYPES =====
    CONTAINS: "contains",
    NOT_CONTAINS: "notContains",
    EQUALS: "equals",
    NOT_EQUAL: "notEqual",
    STARTS_WITH: "startsWith",
    ENDS_WITH: "endsWith",
    BLANK: "blank",
    NOT_BLANK: "notBlank",

    // ===== NUMBER FILTER TYPES =====
    // EQUALS: "equals", // Già definito sopra
    // NOT_EQUAL: "notEqual", // Già definito sopra
    LESS_THAN: "lessThan",
    LESS_THAN_OR_EQUAL: "lessThanOrEqual",
    GREATER_THAN: "greaterThan",
    GREATER_THAN_OR_EQUAL: "greaterThanOrEqual",
    IN_RANGE: "inRange",
    IN: "in",
    // BLANK: "blank", // Già definito sopra
    // NOT_BLANK: "notBlank", // Già definito sopra

    // ===== DATE FILTER TYPES =====
    // EQUALS: "equals", // Già definito sopra
    // NOT_EQUAL: "notEqual", // Già definito sopra
    // LESS_THAN: "lessThan", // Già definito sopra
    // GREATER_THAN: "greaterThan", // Già definito sopra
    // IN_RANGE: "inRange", // Già definito sopra
    // BLANK: "blank", // Già definito sopra
    // NOT_BLANK: "notBlank", // Già definito sopra

    // ===== SET FILTER TYPES (Enterprise) =====
    // Per Set Filter non ci sono "type" specifici, si usano direttamente i values

    // ===== MULTI FILTER OPERATORS =====
    AND: "AND",
    OR: "OR",

    // ===== FLOATING FILTER TYPES =====
    FLOATING_FILTER: "floatingFilter"
} as const;

export type AgGridFilterType = typeof AG_GRID_FILTER_TYPE[keyof typeof AG_GRID_FILTER_TYPE];

export const AG_GRID_FILTER_TYPE_LABEL: Record<string, string> = {
    contains: "Contiene",
    notContains: "Non contiene",
    equals: "Uguale a",
    notEqual: "Diverso da",
    startsWith: "Inizia con",
    endsWith: "Finisce con",
    blank: "Vuoto",
    notBlank: "Non vuoto",
    lessThan: "Minore di",
    lessThanOrEqual: "Minore o uguale a",
    greaterThan: "Maggiore di",
    greaterThanOrEqual: "Maggiore o uguale a",
    inRange: "Nell'intervallo",
    in: "Incluso in",
    AND: "E",
    OR: "O",
    floatingFilter: "Filtro rapido",
};

export const getFilterTypeLabel = (filterType: string): string =>
    AG_GRID_FILTER_TYPE_LABEL[filterType] ?? filterType;