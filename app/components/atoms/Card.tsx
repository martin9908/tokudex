import type { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    elevated?: boolean;
}

export default function Card({ elevated = false, className = "", children, ...props }: CardProps) {
    return (
        <div
            {...props}
            className={[
                elevated ? "tdx-card-elevated" : "tdx-card",
                className,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {children}
        </div>
    );
}
