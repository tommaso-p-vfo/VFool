import { createContext, ReactNode, useContext } from "react";
import { consoleErrorReporter, IReporter, ISuccessReporter } from "./types/IReporter";

const ReporterContext = createContext<IReporter | null>(null);

export const useReporter = () => {
    const context = useContext(ReporterContext);
    if (!context) {
        return { success: {} as ISuccessReporter, error: consoleErrorReporter } as IReporter; 
    }
    return context;
}


export const ReporterProvider = ({ children, reporter }: {children?: ReactNode, reporter?: IReporter}) => {

    const value = reporter ?? { success: {} as ISuccessReporter, error: consoleErrorReporter } as IReporter;

    return (<ReporterContext.Provider value={value}>
        {children}
    </ReporterContext.Provider>);

};
