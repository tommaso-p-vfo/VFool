export default interface ApiFatalError {

    status: string;
    code: number;
    error: string;
    message: string;
    data: any;
    uri: string;

}

const createApiFatalError = (data: any):ApiFatalError => {

    return {
        code: 0,
        status: '',
        error: '',
        message: '',
        data: data ?? {}
    } as ApiFatalError;
}

const isApiFatalError = (obj:any): Boolean => {

   return typeof obj === "object" &&
        obj !== null &&
        typeof obj.status === "string" &&
        typeof obj.code === "number" &&
        typeof obj.error === "string" &&
        typeof obj.message === "string" &&
        "data" in obj // accetta qualsiasi valore per data

}

export { isApiFatalError, createApiFatalError };