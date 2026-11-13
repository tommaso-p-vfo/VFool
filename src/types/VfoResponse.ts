import { VfoError } from "./VfoError";

export type VfoResponse = {
    success: boolean;
    error?: VfoError;
}