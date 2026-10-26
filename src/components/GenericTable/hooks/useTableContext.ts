import React, { useContext } from "react";
import { TableContext } from "../contexts/TableContext";

export const useTableContext = () => {
    const context = useContext(TableContext);
    if (!context) {
        throw new Error("useTableContext must be used within an TableProvider");
    }
    return context;
}