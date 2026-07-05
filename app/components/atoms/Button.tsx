import type { ButtonHTMLAttributes } from "react";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "./buttonStyles";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    full?: boolean;
}

export default function Button({
    variant = "primary",
    size = "md",
    full = false,
    className = "",
    children,
    ...props
}: ButtonProps) {
    return (
        <button {...props} className={buttonClasses({ variant, size, full, className })}>
            {children}
        </button>
    );
}
