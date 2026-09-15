"use client";

import { useState, useTransition } from "react";
import { buttonClasses } from "../components/atoms";

type Action = (formData: FormData) => Promise<void>;
type Mode = "signin" | "signup";
type ActiveAction = "signin" | "signup" | "reset" | null;

export default function LoginForm({
    signIn,
    signUp,
    forgotPassword,
    initialMode = "signin",
}: {
    signIn: Action;
    signUp: Action;
    forgotPassword: Action;
    initialMode?: Mode;
}) {
    const [mode, setMode] = useState<Mode>(initialMode);
    const [isPending, startTransition] = useTransition();
    const [active, setActive] = useState<ActiveAction>(null);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const action = mode === "signin" ? signIn : signUp;
        setActive(mode);
        startTransition(async () => {
            await action(formData);
        });
    }

    function handleForgot(event: React.MouseEvent<HTMLButtonElement>) {
        event.preventDefault();
        const form = event.currentTarget.form;
        if (!form) return;
        const formData = new FormData(form);
        setActive("reset");
        startTransition(async () => {
            await forgotPassword(formData);
        });
    }

    return (
        <div>
            {mode === "signup" && (
                <>
                    <p className="tdx-eyebrow">Create account</p>
                    <h2 className="text-[19px] font-medium mt-1.5">Start your dex</h2>
                    <p className="text-[12.5px] leading-[1.55] text-[var(--text-secondary)] mt-2 mb-4">
                        Track every series, log episodes with a recap, and earn
                        ranks as you go.
                    </p>
                </>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {mode === "signup" && (
                    <div>
                        <label htmlFor="name" className="tdx-label">
                            Display name{" "}
                            <span className="tdx-label-hint">shown on shared cards</span>
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            maxLength={60}
                            className="tdx-field"
                            placeholder="Godai"
                        />
                    </div>
                )}

                <div>
                    <label htmlFor="email" className="tdx-label">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="tdx-field"
                        placeholder="you@example.com"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="tdx-label">
                        Password
                        {mode === "signup" && (
                            <>
                                {" "}
                                <span className="tdx-label-hint">at least 8 characters</span>
                            </>
                        )}
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        required
                        minLength={mode === "signup" ? 8 : undefined}
                        className="tdx-field"
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    aria-busy={isPending && active === mode}
                    className={buttonClasses({ size: "lg", className: "mt-1 w-full min-h-[44px]" })}
                >
                    {mode === "signin"
                        ? isPending && active === "signin"
                            ? "Signing in…"
                            : "Sign in"
                        : isPending && active === "signup"
                          ? "Creating account…"
                          : "Create account"}
                </button>

                <div className="flex justify-between items-center gap-3 text-xs mt-0.5">
                    {mode === "signin" ? (
                        <>
                            <button
                                type="button"
                                onClick={handleForgot}
                                disabled={isPending}
                                className="tdx-focus-ring rounded text-[var(--accent-primary)] disabled:opacity-50"
                            >
                                {isPending && active === "reset"
                                    ? "Sending reset email…"
                                    : "Forgot password?"}
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode("signup")}
                                className="tdx-focus-ring rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            >
                                Create an account
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => setMode("signin")}
                            className="tdx-focus-ring rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] ml-auto"
                        >
                            Already have an account? Sign in
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
