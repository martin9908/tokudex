import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "../../lib/supabase/server";
import LoginForm from "./LoginForm";

async function getOrigin() {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
}

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
        const fullName = (formData.get("name") as string | null)?.trim();

        const origin = await getOrigin();
        const supabase = await createClient();
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
                data: fullName ? { full_name: fullName } : undefined,
            },
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

        const origin = await getOrigin();
        const supabase = await createClient();
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${origin}/auth/callback?next=/reset-password`,
        });

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
            <div className="w-full max-w-sm rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-6 backdrop-blur-xl">
                <h1 className="text-2xl font-semibold tracking-tight mb-1">TokuDex</h1>
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70 mb-2">
                    Tokusatsu Episode Tracker
                </p>
                <p className="text-sm text-cyan-200/70 mb-8">
                    Remember where you stopped and what happened last — TokuDex tracks your progress, it doesn&apos;t stream episodes.
                </p>
                {error && (
                    <p
                        role="alert"
                        className="mb-4 rounded-xl border border-red-900/45 bg-red-500/10 px-3 py-2 text-sm text-red-300"
                    >
                        {error}
                    </p>
                )}
                {message && (
                    <p
                        role="status"
                        className="mb-4 rounded-xl border border-emerald-900/45 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
                    >
                        {message}
                    </p>
                )}
                <LoginForm
                    signIn={signIn}
                    signUp={signUp}
                    forgotPassword={forgotPassword}
                />
                <p className="mt-6 text-center text-xs text-cyan-200/55">
                    By continuing you agree to our{" "}
                    <Link href="/terms" className="text-cyan-300/80 hover:text-cyan-200">
                        Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-cyan-300/80 hover:text-cyan-200">
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
