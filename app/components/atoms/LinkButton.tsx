import Link from "next/link";
import type { ComponentProps } from "react";
import { buttonClasses, type ButtonVariant, type ButtonSize } from "./buttonStyles";

interface LinkButtonProps extends ComponentProps<typeof Link> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    full?: boolean;
}

/** A `next/link` styled to match the `Button` atom. */
export default function LinkButton({
    variant = "primary",
    size = "md",
    full = false,
    className = "",
    children,
    ...props
}: LinkButtonProps) {
    return (
        <Link {...props} className={buttonClasses({ variant, size, full, className })}>
            {children}
        </Link>
    );
}
