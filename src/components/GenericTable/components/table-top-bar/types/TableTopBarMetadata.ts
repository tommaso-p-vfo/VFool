import type { ActionBarConfig } from "../../../types/TableMetadata";
import type { ActionsMetadata } from "../../actions/types/ActionsMetadata";
import type { QuickFilterMetadata } from "../../quick-filter/types/QuickFilterMetadata";

export type TableTopBarMetadata<T> = {
    quickFilterMetadata: QuickFilterMetadata;
    actionsMetadata: ActionsMetadata<T>;
    actionBarConfig?: ActionBarConfig;
}