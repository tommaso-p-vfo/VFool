import type { ReactElement } from "react";
import type { ActionFuncProps } from "../../../../modals/GenericModal";

export type Action = {

    name: string;
    icon?: ReactElement;
    onClick: (props: ActionFuncProps) => void | Promise<void>; //async function

}

export const ACTION_NAME = {
    ADD: 'add',
    EDIT: 'edit',
    DELETE: 'delete',
    VIEW: 'view',
    EXPORT: 'export'
}

export type ActionType = typeof ACTION_NAME[keyof typeof ACTION_NAME];