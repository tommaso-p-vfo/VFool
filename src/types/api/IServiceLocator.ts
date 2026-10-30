import { ApiRequest } from "./ApiRequest";
import { ApiMultiResponse, ApiResponse } from "./ApiResponse";

export interface IServiceLocator {
    callService: (request: ApiRequest) => Promise<ApiResponse | ApiMultiResponse>;
}