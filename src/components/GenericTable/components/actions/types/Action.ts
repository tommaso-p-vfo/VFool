import type { ReactElement } from "react";
import type { ActionFuncProps } from "../../../../modals/GenericModal";

export type Action = {

    name: string;
    icon?: ReactElement;
    onClick: (props: ActionFuncProps) => void | Promise<void>; //async function

}