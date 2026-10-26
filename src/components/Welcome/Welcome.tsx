import Button, { type ButtonProps } from 'react-bootstrap/Button';

export interface WelcomeProps extends ButtonProps {
    /** Testo mostrato nel pulsante */
    label: string;
}

export function Welcome({ label, ...rest }: WelcomeProps) {
    return <Button {...rest}>{label}</Button>;
}