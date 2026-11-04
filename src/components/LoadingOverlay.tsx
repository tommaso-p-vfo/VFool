import type { CSSProperties } from "react";
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

type Props = {
    color?: ThemeColor | string;
    bgColor?: ThemeColor | string;
    /** es. "4px", "0" per disattivarlo */
    blur?: string;
    text?: string;
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
    className,
}: Props) => {
    // Imposta la variabile solo se la prop è passata:
    // altrimenti vince il valore globale (o il fallback)
    const vars = {
        ...(bgColor && { "--vfo-spinner-bg": toCssColor(bgColor) }),
        ...(blur && { "--vfo-spinner-blur": blur }),
        ...(color && { "--vfo-spinner-color": toCssColor(color) }),
    } as CSSProperties;

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
                            <FaEllipsisH style={{ width: "2rem", height: "2rem" }} />
                        </span>
                    </div>
                    <div className="mt-3 text-muted">{text}</div>
                </div>
            </div>
        </>
    );
};