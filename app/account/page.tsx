import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { WarningOctagon } from "@phosphor-icons/react/ssr";
import { createClient } from "@/lib/supabase/server";
import { THEME_COOKIE } from "@/lib/theme";
import SignOutButton from "../components/molecules/SignOutButton";
import SupportLink from "../components/molecules/SupportLink";
import ThemeToggle from "../components/molecules/ThemeToggle";
import EditNameForm from "./EditNameForm";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountButton from "./DeleteAccountButton";
import { buttonClasses } from "../components/atoms";

export const metadata = {
    title: "Account",
};

export default async function AccountPage() {
    const supabase = await createClient();
    const [
        {
            data: { user },
        },
        cookieStore,
    ] = await Promise.all([supabase.auth.getUser(), cookies()]);

    if (!user) redirect("/login");

    const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();

    return (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-10 w-full">
            <h1 className="text-[22px] tracking-[-0.02em]">Account</h1>
            <p className="text-[13px] text-[var(--text-secondary)] mt-2 mb-4">
                Manage your TokuDex account.
            </p>

            <nav className="flex flex-wrap gap-2 mb-4 md:hidden" aria-label="You">
                <Link href="/achievements" className="tdx-pill">Awards</Link>
                <Link href="/invite" className="tdx-pill">Invite friends</Link>
                <Link href="/notifications" className="tdx-pill">Notifications</Link>
                <Link href="/community" className="tdx-pill">My submissions</Link>
            </nav>

            <section className="tdx-panel p-4">
                <h2 className="text-sm font-medium mb-3">Profile</h2>
                <EditNameForm initialName={fullName ?? ""} />
                <div className="flex items-center justify-between gap-3 mt-3 text-[12.5px]">
                    <span className="text-[var(--text-secondary)]">Email</span>
                    <span className="truncate">{user.email}</span>
                </div>
                <div className="mt-3.5">
                    <SignOutButton className={buttonClasses({ variant: "secondary" })} />
                </div>
            </section>

            <section className="tdx-panel p-4 mt-3.5">
                <h2 className="text-sm font-medium">Appearance</h2>
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-1 mb-3">
                    Slate is the dark palette, Paper the light one.
                </p>
                <ThemeToggle initial={cookieStore.get(THEME_COOKIE)?.value} />
            </section>

            <section className="tdx-panel p-4 mt-3.5">
                <h2 className="text-sm font-medium mb-3">Change password</h2>
                <ChangePasswordForm />
            </section>

            <section className="tdx-panel p-4 mt-3.5">
                <h2 className="text-sm font-medium">Invite friends</h2>
                <p className="text-[12.5px] text-[var(--text-secondary)] mt-1">
                    Share TokuDex and earn the Recruiter badge when a friend joins.
                </p>
                <Link href="/invite" className={buttonClasses({ className: "mt-3" })}>
                    Get your invite link
                </Link>
            </section>

            <section className="mt-3.5 p-4 rounded-lg bg-[var(--warning-tint)] border border-[var(--warning)]">
                <h2 className="flex items-center gap-2 text-sm font-medium text-[var(--warning)]">
                    <WarningOctagon size={17} aria-hidden />
                    Danger zone
                </h2>
                <p className="text-[12.5px] text-[var(--warning)] mt-1.5 leading-[1.5]">
                    Permanently delete your account and all of your tracking
                    data. This can&apos;t be undone.
                </p>
                <div className="mt-3">
                    <DeleteAccountButton />
                </div>
            </section>

            <p className="mt-4 text-center text-[11.5px] text-[var(--text-muted)]">
                <Link href="/terms" className="hover:text-[var(--text-primary)]">Terms</Link>
                <span className="mx-2">·</span>
                <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link>
                <SupportLink
                    label="Support"
                    className="ml-2 border-l border-[var(--line)] pl-2 hover:text-[var(--text-primary)]"
                />
            </p>
        </div>
    );
}
