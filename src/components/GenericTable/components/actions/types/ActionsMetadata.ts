import type { ActionsConfig } from "./ActionsConfig";

export type ActionsMetadata<T = any> = { 
    domain: string,
    tableName: string,
    actionsConfig: ActionsConfig<T>
}