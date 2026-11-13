import { IReporter } from "../contexts/reporter/types/IReporter";
import { ErrorCode } from "../types";
import { VfoCaller, VfoResponse } from "../types/VfoCallers";
import { createError, getErrorCodeName } from "./ErrorHelper";

export const vfoCall = async (
    caller: VfoCaller,
    f: (p?: unknown) => Promise<unknown>, 
    reporter: IReporter | null,
    errorCode?: ErrorCode

): Promise<VfoResponse> => {

    try {
        await f();
        reporter?.success(caller);
        return { success: true, caller } as VfoResponse;
    }

    catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e ?? 'vfoCall error');
        const res = {
            success: false,
            caller,
            error: createError(getErrorCodeName(errorCode), message, { error: e })
        };
        if (reporter?.error) reporter?.error(caller, res.error);
        return res;
    }
    finally {

    }


}