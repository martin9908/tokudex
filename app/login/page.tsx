import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";

type LoginPageProps = {
    searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { error, message } = await searchParams;

    async function signIn(formData: FormData) {
        "use server";
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const supabase = await createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            redirect(
                `/login?error=${encodeURIComponent(authError.message)}`
            );
        }

        redirect("/");
    }

    async function signUp(formData: FormData) {
        "use server";
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        const supabase = await createClient();
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) {
            redirect(`/login?error=${encodeURIComponent(authError.message)}`);
        }

        redirect(
            `/login?message=${encodeURIComponent(
                "Account created. Check your email to confirm your account."
            )}`
        );
    }

    async function forgotPassword(formData: FormData) {
        "use server";
        const email = formData.get("email") as string;

        const supabase = await createClient();
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email);

        if (authError) {
            redirect(`/login?error=${encodeURIComponent(authError.message)}`);
        }

        redirect(
            `/login?message=${encodeURIComponent(
                "Password reset email sent."
            )}`
        );
    }

    return (
        <div className="flex flex-1 items-center justify-center px-4 py-16">
            <div className="w-full max-w-sm">
                <h1 className="text-2xl font-semibold tracking-tight mb-2">TokuDex</h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">
                    Remember. Track. Continue.
                </p>
                {error && (
                    <p className="mb-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}
                {message && (
                    <p className="mb-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                        {message}
                    </p>
                )}
                <form className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="email" className="text-sm font-medium">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="password" className="text-sm font-medium">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                            placeholder="••••••••"
                        />
                    </div>
                    <button
                        formAction={signIn}
                        type="submit"
                        className="mt-2 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                        Sign in
                    </button>

                    <button
                        formAction={signUp}
                        type="submit"
                        className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                    >
                        Register
                    </button>

                    <button
                        formAction={forgotPassword}
                        type="submit"
                        className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                    >
                        Forgot Password
                    </button>
                </form>
            </div>
        </div>
    );
}
