"use client";

import { useState, useTransition } from "react";

type Action = (formData: FormData) => Promise<void>;
type Mode = "signin" | "signup";
type ActiveAction = "signin" | "signup" | "reset" | null;

export default function LoginForm({
    signIn,
    signUp,
    forgotPassword,
}: {
    signIn: Action;
    signUp: Action;
    forgotPassword: Action;
}) {
    const [mode, setMode] = useState<Mode>("signin");
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

    const inputClass =
        "min-h-[44px] rounded-xl border border-cyan-900/50 bg-[#06111d]/90 px-3 py-2.5 text-sm text-cyan-50 placeholder:text-cyan-200/40 outline-none focus:ring-2 focus:ring-cyan-500/60";

    function tabClass(tab: Mode) {
        return `min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
            mode === tab
                ? "bg-cyan-500/15 text-cyan-200 border border-cyan-600/40"
                : "text-cyan-100/60 hover:text-cyan-100 border border-transparent"
        }`;
    }

    return (
        <div>
            <div role="tablist" aria-label="Authentication" className="mb-5 grid grid-cols-2 gap-2">
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signin"}
                    onClick={() => setMode("signin")}
                    className={tabClass("signin")}
                >
                    Sign in
                </button>
                <button
                    type="button"
                    role="tab"
                    aria-selected={mode === "signup"}
                    onClick={() => setMode("signup")}
                    className={tabClass("signup")}
                >
                    Sign up
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === "signup" && (
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="name" className="text-sm font-medium text-cyan-100/90">
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            maxLength={60}
                            className={inputClass}
                            placeholder="Godai"
                        />
                    </div>
                )}

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-cyan-100/90">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className={inputClass}
                        placeholder="you@example.com"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-cyan-100/90">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                        required
                        className={inputClass}
                        placeholder="••••••••"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    aria-busy={isPending && active === mode}
                    className="tdx-focus-ring mt-1 inline-flex min-h-[44px] items-center justify-center rounded-xl bg-cyan-500/90 px-4 text-sm font-semibold text-[#031018] transition-colors hover:bg-cyan-400 disabled:opacity-50"
                >
                    {mode === "signin"
                        ? isPending && active === "signin"
                            ? "Signing in…"
                            : "Sign in"
                        : isPending && active === "signup"
                          ? "Creating account…"
                          : "Create account"}
                </button>

                {mode === "signin" && (
                    <button
                        type="button"
                        onClick={handleForgot}
                        disabled={isPending}
                        className="tdx-focus-ring rounded-lg text-sm text-cyan-300/80 transition-colors hover:text-cyan-200 disabled:opacity-50"
                    >
                        {isPending && active === "reset" ? "Sending reset email…" : "Forgot password?"}
                    </button>
                )}
            </form>

            <p className="mt-5 text-center text-sm text-cyan-200/70">
                {mode === "signin" ? (
                    <>
                        New to TokuDex?{" "}
                        <button
                            type="button"
                            onClick={() => setMode("signup")}
                            className="tdx-focus-ring rounded font-semibold text-cyan-300 hover:text-cyan-200"
                        >
                            Create an account
                        </button>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <button
                            type="button"
                            onClick={() => setMode("signin")}
                            className="tdx-focus-ring rounded font-semibold text-cyan-300 hover:text-cyan-200"
                        >
                            Sign in
                        </button>
                    </>
                )}
            </p>
        </div>
    );
}
