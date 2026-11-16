import { IReporter } from "../contexts/reporter/types/IReporter";
import { ErrorCode } from "../types";
import { VfoCaller, VfoResponse } from "../types/VfoCallers";
import { createError, getErrorCodeName } from "./ErrorHelper";

export const vfoCall = async (
    caller: VfoCaller, //componente
    method: string, //azione specifica
    f: (p?: unknown) => Promise<unknown>, 
    reporter: IReporter | null,
    errorCode?: ErrorCode,
    successCallback?: (d: unknown) => Promise<void>

): Promise<VfoResponse> => {

    try {
        await f();
        reporter?.success(caller, method, { message: 'vfoCall success' }, successCallback);
        return { success: true, caller, method } as VfoResponse;
    }

    catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e ?? 'vfoCall error');
        const res = {
            success: false,
            caller,
            method,
            error: createError(caller, method, message, { error: e }, getErrorCodeName(errorCode))
        };
        if (reporter?.error) reporter?.error(caller, method, res.error);
        return res;
    }
    finally {

    }


}