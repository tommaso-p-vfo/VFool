import { createContext, useContext } from "react";
import { IReporter } from "./types/IReporter";

const ReporterContext = createContext<IReporter | null>(null);

export const ReporterProvider = ReporterContext.Provider;
export const useReporter = () => useContext(ReporterContext);

// // dentro un componente della libreria
// const reporter = useReporter();
// reporter?.success("Salvataggio completato");