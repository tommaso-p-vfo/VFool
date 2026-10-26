export default interface ApiResponse {

    success: boolean;
    status: number;
    code?: string;
    error?: string;
    message?: string;
    data?: any;
    uri: string;
    resourceName: string;

}

/**
 * interfaccia per la gestione delle chiamate sequenziali al server
 * success conterrà le chiamate sequenziali andate a buon fine
 * errors quelle fallite
 */
interface ApiMultiResponse {
    success: ApiResponse[];
    errors: ApiResponse[];
}

export type { ApiMultiResponse }