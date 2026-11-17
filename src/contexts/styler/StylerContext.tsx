import { createContext, ReactNode, useContext } from "react";
import { IStyler } from "./types/IStyler";

const StylerContext = createContext<IStyler | null>(null);

export const useStyler = () => {
    const context = useContext(StylerContext);
    if (!context) {
        return { 
            contrastOptions: {
                minContrast: 7
            }
        } as IStyler; 
    }
    return context;
}


export const StylerProvider = ({ children, styler }: { children?: ReactNode, styler?: IStyler }) => {

    const value = styler ?? {
        contrastOptions: {
            minContrast: 7
        }
    } as IStyler;

    return (<StylerContext.Provider value={value}>
        {children}
    </StylerContext.Provider>);

};
