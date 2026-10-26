import type ApiRequest from '../types/api/ApiRequest';
import type ApiResponse from '../types/api/ApiResponse';
import type { IServiceLocator } from '../service-locator/IServiceLocator';

/**
 * Chiama un servizio backend tramite il service locator.
 *
 * @remarks
 * Costruisce la `ApiRequest` a partire dal nome del servizio e dai dati.
 * Se `data` non è indicato viene inviato un oggetto vuoto.
 *
 * @param serviceLocator - Service locator che esegue la chiamata.
 * @param service - Nome del servizio, di solito creato con `createCrudEndpoints`.
 * @param data - Payload della richiesta.
 * @param metadata - Metadati aggiuntivi (paginazione, filtri, ecc.).
 * @returns La risposta del servizio.
 *
 * @example
 * ```ts
 * const tenderTypes = createCrudEndpoints('configuration.tenderTypes');
 * const response = await getDataFromServer(serviceLocator, tenderTypes.LIST);
 * ```
 */
export async function getDataFromServer(
    serviceLocator: IServiceLocator,
    service: string,
    data?: unknown,
    metadata?: unknown,
): Promise<ApiResponse> {
    const request = {
        data: data ?? {},
        metadata,
        service,
    } as ApiRequest;

    return (await serviceLocator.callService(request)) as ApiResponse;
}