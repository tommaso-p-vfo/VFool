export type CopyToClipboardResponse = { message: string; success: boolean }

/**
 * Copia un testo negli appunti e mostra un toast di conferma.
 *
 * @remarks
 * Usa la Clipboard API, disponibile solo in contesti sicuri (HTTPS o localhost).
 * Se la copia fallisce, l'errore viene scritto in console e viene chiamata
 * `fallbackFunction`, se fornita.
 *
 *
 * @param data - Testo da copiare. I numeri vengono convertiti in stringa.
 * @param dataName - Nome del dato, mostrato nel messaggio (es. `'Codice fiscale'`).
 * @param fallbackFunction - Chiamata con `data` se la copia non riesce.
 * @returns un oggetto con un message e un success flag - `true` se la copia è riuscita, altrimenti `false`.
 *
 * @example
 * ```ts
 * await copyToClipboard('RSSMRA80A01B354X', 'Codice fiscale');
 * // toast: "Codice fiscale copiato negli appunti!"
 * ```
 *
 * @example Con fallback
 * ```ts
 * const ok = await copyToClipboard(iban, 'IBAN', (text) => window.prompt('Copia manualmente:', text));
 * ```
 */
export async function copyToClipboard(
    data: string | number,
    dataName?: string,
    fallbackFunction?: (data: string) => void,
): Promise<CopyToClipboardResponse> {
    const text = String(data);
    try {
        await navigator.clipboard.writeText(text);
        return { message: dataName ? `${dataName} copiato negli appunti!` : 'Copiato negli appunti!', success: true };
    } catch (error) {
        console.error(
            dataName ? `${dataName}: errore durante la copia` : 'Errore durante la copia',
            error,
        );
        fallbackFunction?.(text);
        return { message: 'copyToClipboard failed!', success: false };
    }
}