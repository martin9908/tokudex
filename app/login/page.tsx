import Link from "next/link";
import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "../../lib/supabase/server";
import { trackServer } from "@/lib/analytics";
import { attributeReferral } from "@/lib/referrals";
import { ensureProfile } from "@/lib/profiles";
import { isValidEmail, validatePasswordStrength } from "@/lib/validation";
import LoginForm from "./LoginForm";
import { EnvelopeSimple, WarningCircle } from "@phosphor-icons/react/ssr";

async function getOrigin() {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
    const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
    return `${proto}://${host}`;
}

type LoginPageProps = {
    searchParams: Promise<{ error?: string; message?: string; mode?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { error, message, mode } = await searchParams;

    async function signIn(formData: FormData) {
        "use server";
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        if (!isValidEmail(email)) {
            redirect(`/login?error=${encodeURIComponent("Invalid email address.")}`);
        }
        if (!password || password.length < 1) {
            redirect(`/login?error=${encodeURIComponent("Password is required.")}`);
        }

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

        await ensureProfile();
        await trackServer("login");
        redirect("/");
    }

    async function signUp(formData: FormData) {
        "use server";
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const fullName = (formData.get("name") as string | null)?.trim();

        if (!isValidEmail(email)) {
            redirect(`/login?error=${encodeURIComponent("Invalid email address.")}`);
        }
        const pwError = validatePasswordStrength(password);
        if (pwError) {
            redirect(`/login?error=${encodeURIComponent(pwError)}`);
        }

        const supabase = await createClient();
        // Email confirmation is disabled in Supabase for the soft launch, so a
        // successful signUp returns a session and writes the auth cookie here —
        // the user is signed in immediately and lands on the home page.
        const { error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: fullName ? { full_name: fullName } : undefined,
            },
        });

        if (authError) {
            redirect(`/login?error=${encodeURIComponent(authError.message)}`);
        }

        // Attribute the signup to a referrer if they arrived via an invite link.
        const jar = await cookies();
        const ref = jar.get("tdx_ref")?.value;
        if (ref) {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                try {
                    await attributeReferral(user.id, ref);
                    await trackServer("referral_signup");
                } catch {
                    // Attribution is best-effort; never block signup.
                }
                jar.delete("tdx_ref");
            }
        }

        await ensureProfile();
        await trackServer("signup");
        redirect("/welcome");
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
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16 pb-24">
            <div className="w-full max-w-[372px] tdx-panel p-6">
                <p className="font-semibold text-[22px] leading-none tracking-[-0.035em]">
                    Toku<span className="text-[var(--accent-primary)]">Dex</span>
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--accent-primary)] mt-2">
                    Tokusatsu episode tracker
                </p>
                <p className="text-[12.5px] leading-[1.55] text-[var(--text-secondary)] mt-2.5 mb-5">
                    Remember where you stopped and what happened last — TokuDex
                    tracks your progress, it doesn&apos;t stream episodes.
                </p>
                {error && (
                    <p role="alert" className="tdx-callout tdx-callout-warn mb-3.5 text-xs">
                        <WarningCircle size={14} className="mt-0.5 flex-none" aria-hidden />
                        <span>{error}</span>
                    </p>
                )}
                {message && (
                    <p role="status" className="tdx-callout tdx-callout-ok mb-3.5 text-xs">
                        <EnvelopeSimple size={14} className="mt-0.5 flex-none" aria-hidden />
                        <span>{message}</span>
                    </p>
                )}
                <LoginForm
                    signIn={signIn}
                    signUp={signUp}
                    forgotPassword={forgotPassword}
                    initialMode={mode === "signup" ? "signup" : "signin"}
                />
                <div className="mt-4 border-t border-[var(--line)] pt-3.5 text-center">
                    <Link
                        href="/"
                        className="tdx-focus-ring rounded text-[12.5px] text-[var(--accent-primary)]"
                    >
                        Browse as guest →
                    </Link>
                </div>
                <p className="mt-3.5 text-center text-[11px] leading-[1.5] text-[var(--text-muted)]">
                    By continuing you agree to our{" "}
                    <Link href="/terms" className="hover:text-[var(--text-primary)]">
                        Terms
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="hover:text-[var(--text-primary)]">
                        Privacy Policy
                    </Link>
                    .
                </p>
            </div>
        </div>
    );
}
