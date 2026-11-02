import type { ReactElement } from "react";
import type { ActionFuncProps } from "../../../../modals/GenericModal";
import { TABLE_ACTION_NAME } from "../../../constants/tableActionConstants";

export type _TableAction = {

    name: string;
    icon?: ReactElement;
    onClick: (props: ActionFuncProps) => void | Promise<void>; //async function

}

export type _TableActionType = typeof TABLE_ACTION_NAME[keyof typeof TABLE_ACTION_NAME];