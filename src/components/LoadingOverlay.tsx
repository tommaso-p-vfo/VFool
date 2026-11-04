import type { CSSProperties, JSX, ReactNode } from "react";
import { FaEllipsisH } from "react-icons/fa";
import { ThemeColor, toCssColor } from "../utils";

const SPINNER_CSS = `
:where(.vfo-spinner-overlay) {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--vfo-spinner-z, 2);
  background-color: var(--vfo-spinner-bg, transparent);
  backdrop-filter: blur(var(--vfo-spinner-blur, 2px));
  -webkit-backdrop-filter: blur(var(--vfo-spinner-blur, 2px));
}

:where(.vfo-spinner) {
  display: inline-flex;
  align-items: center;
  color: var(--vfo-spinner-color, var(--vfo-color-primary));
  will-change: opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
  contain: layout style paint;
}

:where(.vfo-spinner) span {
  animation: vfoDotReveal var(--vfo-spinner-duration, 1.3s) infinite ease-in-out;
}

@keyframes vfoDotReveal {
  0%   { clip-path: inset(0 100% 0 0); }
  33%  { clip-path: inset(0 77% 0 0); }
  66%  { clip-path: inset(0 55% 0 0); }
  100% { clip-path: inset(0 0 0 0); }
}
`;

/**
 * Props del componente Overlay.
 *
 * Mostra un livello semitrasparente sopra il contenuto del contenitore padre
 * (es. durante un caricamento o per bloccare l'interazione), con testo e/o icona
 * opzionali centrati.
 *
 * @remarks
 * Il contenitore padre deve avere `position: relative` (o comunque un
 * posizionamento diverso da `static`) perché l'overlay lo copra correttamente.
 *
 * @example
 * // Overlay di caricamento con spinner e testo
 * <Overlay
 *     icon={<Spinner animation="border" size="sm" />}
 *     text="Caricamento in corso..."
 *     bgColor="dark"
 *     color="light"
 * />
 *
 * @example
 * // Overlay senza blur, con colori personalizzati
 * <Overlay blur="0" bgColor="rgba(255, 255, 255, 0.6)" color="#333" />
 */
type Props = {
    /**
     * Colore del contenuto in primo piano (testo e icona).
     *
     * Accetta un colore del tema (es. `"primary"`, `"light"`, `"danger"`)
     * oppure qualsiasi valore CSS valido (`"#fff"`, `"rgb(0,0,0)"`, `"white"`).
     *
     * @example "light"
     * @example "#212529"
     */
    color?: ThemeColor | string;

    /**
     * Colore di sfondo dell'overlay.
     *
     * Accetta un colore del tema oppure qualsiasi valore CSS valido.
     * Per un effetto semitrasparente usa un colore con canale alpha
     * (es. `"rgba(0, 0, 0, 0.5)"` o `"#00000080"`).
     *
     * @example "dark"
     * @example "rgba(0, 0, 0, 0.5)"
     */
    bgColor?: ThemeColor | string;

    /**
     * Intensità della sfocatura applicata al contenuto sottostante
     * (`backdrop-filter: blur(...)`).
     *
     * Deve essere una lunghezza CSS valida. Usa `"0"` per disattivare la sfocatura.
     *
     * @example "4px"
     * @example "0.5rem"
     * @example "0" // nessun blur
     */
    blur?: string;

    /**
     * Testo opzionale mostrato al centro dell'overlay, sotto l'icona se presente.
     *
     * @example "Caricamento in corso..."
     */
    text?: string;

    /**
     * Icona o elemento opzionale mostrato al centro dell'overlay, sopra il testo.
     * Può essere un'icona, uno spinner o qualsiasi elemento JSX.
     *
     * @example <Spinner animation="border" />
     * @example <i className="bi bi-lock-fill" />
     */
    icon?: JSX.Element;

    /**
     * Classi CSS aggiuntive applicate al contenitore dell'overlay.
     * Utile per personalizzare z-index, bordi arrotondati, padding, ecc.
     *
     * @example "rounded z-3"
     */
    className?: string;
};

/**
 * Overlay di caricamento. Il contenitore padre deve avere position: relative.
 *
 * Personalizzabile globalmente via CSS:
 *   --vfo-spinner-bg, --vfo-spinner-blur, --vfo-spinner-z,
 *   --vfo-spinner-color, --vfo-spinner-duration
 */
export const LoadingOverlay = ({
    color,
    bgColor,
    blur,
    text = "Caricamento dati...",
    icon,
    className,
}: Props) => {
    // Imposta la variabile solo se la prop è passata:
    // altrimenti vince il valore globale (o il fallback)
    const vars = {
        ...(bgColor && { "--vfo-spinner-bg": toCssColor(bgColor) }),
        ...(blur && { "--vfo-spinner-blur": blur }),
        ...(color && { "--vfo-spinner-color": toCssColor(color) }),
    } as CSSProperties;

    const Icon = icon ?? <FaEllipsisH style={{ width: "2rem", height: "2rem" }} />;

    return (
        <>
            <style href="vfo-spinner" precedence="default">
                {SPINNER_CSS}
            </style>
            <div
                className={`vfo-spinner-overlay ${className ?? ""}`}
                style={vars}
                role="status"
                aria-live="polite"
            >
                <div className="d-flex flex-column align-items-center">
                    <div className="vfo-spinner">
                        <span>
                            {Icon}
                        </span>
                    </div>
                    <div className="mt-3 text-muted">{text}</div>
                </div>
            </div>
        </>
    );
};