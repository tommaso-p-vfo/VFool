import { CrudEndpoints, SERVICE_ENDPOINT } from "../types/api/ApiEndpoints";

/**
 * Crea gli endpoint CRUD di un servizio a partire dal suo percorso base.
 *
 * @remarks
 * Genera solo le operazioni `GET`, `LIST`, `UPDATE`, `SAVE` e `DELETE`.
 * Le operazioni `DOWNLOAD`, `SUMMARY` ed `EXPORT` vanno composte a mano
 * con {@link SERVICE_ENDPOINT}, perché non tutti i servizi le espongono.
 *
 * @typeParam TBase - Percorso base del servizio, dedotto dall'argomento.
 * @param basePath - Percorso base, separato da punti (es. `"configuration.tenderTypes"`).
 * @returns Un oggetto in sola lettura con i percorsi completi di ogni operazione.
 *
 * @example
 * ```ts
 * const tenderTypes = createCrudEndpoints('configuration.tenderTypes');
 *
 * tenderTypes.LIST; // → 'configuration.tenderTypes.list'
 * tenderTypes.SAVE; // → 'configuration.tenderTypes.save'
 * ```
 *
 * @example Aggiungere un'operazione non CRUD
 * ```ts
 * const contracts = {
 *   ...createCrudEndpoints('contracts'),
 *   EXPORT: `contracts.${SERVICE_ENDPOINT.EXPORT}`,
 * } as const;
 * ```
 */
export function createCrudEndpoints<TBase extends string>(
    basePath: TBase,
): CrudEndpoints<TBase> {
    return {
        GET: `${basePath}.${SERVICE_ENDPOINT.GET}`,
        LIST: `${basePath}.${SERVICE_ENDPOINT.LIST}`,
        UPDATE: `${basePath}.${SERVICE_ENDPOINT.UPDATE}`,
        SAVE: `${basePath}.${SERVICE_ENDPOINT.SAVE}`,
        DELETE: `${basePath}.${SERVICE_ENDPOINT.DELETE}`,
    };
}

export const VFO_DOMAIN = {

    // AUTH: 'auth',
    // TENDERS: 'tenders',
    // CONTRACTS: 'contracts',
    // QUOTES: 'quotes',
    // CUSTOMERS: 'customers',
    // ORGANIZATIONS: 'organizations',
    // NEGOTIATIONS: 'negotiations',
    // DASHBOARD: 'dashboard',
    // ACTIVITIES: 'activities',
    // CONFIGURATION: 'configuration',
    // NOTIFICATION: 'notification',
    // DEPARTMENTS: 'departments',
    USERS: 'users',
    // AGENTS: 'agents',
    SYSTEM: 'system'
}

export const VFO_SUBDOMAIN = {
    // ONLY_MINE_FILTER: 'onlyMineFilter',
    // REPORT: 'report',
    // STATISTICS: 'statistics',
    // DETAILS: 'details',
    // TENDERS: 'tenders',
    // TENDER_TYPES: 'tenderTypes',
    // TENDER_STATUSES: 'tenderStatuses',
    // TENDER_PRIORITIES: 'tenderPriorities',
    // TENDER_PRIMARY_CATEGORIES: 'tenderPrimaryCategories',
    // TENDER_SECONDARY_CATEGORIES: 'tenderSecondaryCategories',
    // TENDER_ATTACHMENTS: 'tenderAttachments',
    // TENDER_COMMENTS: 'tenderComments',
    // CONTRACTS: 'contracts',
    // CONTRACT_ATTACHMENTS: 'contractAttachments',
    // CONTRACT_COMMENTS: 'contractComments',
    // QUOTES: 'quotes',
    // QUOTES_DETAILS: 'quoteDetails',
    // NEGOTIATIONS: 'negotiations',
    // NEGOTIATION_STATUSES: 'negotiationStatuses',
    // NEGOTIATION_STATUS: 'negotiationStatus',
    // NEGOTIATION_COMMENTS: 'negotiationComments',
    // NEGOTIATION_ATTACHMENTS: 'negotiationAttachments',
    // WON_QUOTES: 'wonQuotes',
    // COMMENT_TYPES: 'commentTypes',
    // PROTOCOL_NUMBER: 'protocolNumber',
    // PROTOCOL_CATEGORIES: 'protocolCategories',
    // PROTOCOL_SEPARATORS: 'protocolSeparators',
    // PROTOCOL_STRATEGIES: 'protocolStrategies',
    // CONSTRUCTION_SITES: 'constructionSites',
    // CONSTRUCTION_SITE_TYPES: 'constructionSiteTypes',
    // CONTRACT_STATUSES: 'contractStatuses',
    // CUSTOMERS: 'customers',
    // CUSTOMER_NOTES: 'customerNotes',
    // ORGANIZATIONS: 'organizations',
    // AGENTS: 'agents',
    // HIERARCIES: 'hierarchies',
    // MANAGERS: 'managers',
    // ACTIVITIES: 'activities',
    // ACTIVITY_TYPES: 'activityTypes',
    // ACTIVITY_STATUSES: 'activityStatuses',
    // ACTIVITY_PRIORITIES: 'activityPriorities',
    // ACTIVITY_ATTACHMENTS: 'activityAttachments',
    // ACTIVITY_COMMENTS: 'activityComments',
    USERS: 'users',
    USER_TABLE_SAVED_FILTER: 'userTableSavedFilter',
    USER_TABLE_COLUMN_SETTINGS: 'userTableColumnSettings',
    // USER_DEPARTMENTS: 'userDepartments',
    // DEPARTMENTS: 'departments',
    // DEPARTMENT_USERS: 'departmentsUsers',
    // AUTHORIZATIONS: 'authorizations',
    // SMTP_CONFIGURATIONS: 'smtpConfigurations',
    // EMAIL_QUEUE: 'emailQueue',
    // FILE_STORAGES: 'fileStorages',
    // COMPANY_SETTINGS: 'companySettings',
    // TIMEZONES: 'timezones',
    // DOCUMENT_TYPES: 'documentTypes',
    // CUSTOMER_TYPES: 'customerTypes',
    // CUSTOMER_CATEGORIES: 'customerCategories',
    // CUSTOMER_REPORT_TYPES: 'customerReportTypes',
    // CUSTOMER_REPORT_STATUSES: 'customerReportStatuses',
    // PAYMENT_METHODS: 'paymentMethods',
    // PASSWORD: 'password',
    // AREAS: 'areas',
    // VERSION: 'version'
}