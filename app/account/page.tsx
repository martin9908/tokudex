import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SignOutButton from "../components/SignOutButton";
import SupportLink from "../components/SupportLink";
import EditNameForm from "./EditNameForm";
import ChangePasswordForm from "./ChangePasswordForm";
import DeleteAccountButton from "./DeleteAccountButton";

export const metadata = {
    title: "Account — TokuDex",
};

export default async function AccountPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const fullName = (user.user_metadata?.full_name as string | undefined)?.trim();

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-10 w-full space-y-4">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Account</h1>
                <p className="text-sm text-cyan-200/70 mt-1">Manage your TokuDex account.</p>
            </div>

            <section className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-5">
                <h2 className="text-lg font-semibold mb-3">Profile</h2>
                <EditNameForm initialName={fullName ?? ""} />
                <dl className="mt-4 text-sm">
                    <div className="flex items-center justify-between gap-3">
                        <dt className="text-cyan-200/70">Email</dt>
                        <dd className="text-cyan-100 truncate">{user.email}</dd>
                    </div>
                </dl>
                <div className="mt-4">
                    <SignOutButton className="inline-flex min-h-[40px] items-center rounded-lg border border-cyan-900/60 px-3 text-cyan-100 hover:bg-cyan-500/10" />
                </div>
            </section>

            <section className="rounded-2xl border border-cyan-900/45 bg-[#0c1622]/75 p-5">
                <h2 className="text-lg font-semibold mb-3">Change password</h2>
                <ChangePasswordForm />
            </section>

            <section className="rounded-2xl border border-red-900/45 bg-red-500/5 p-5">
                <h2 className="text-lg font-semibold mb-1 text-red-200">Danger zone</h2>
                <p className="text-sm text-cyan-200/70 mb-3">
                    Permanently delete your account and all of your tracking data. This can&apos;t be undone.
                </p>
                <DeleteAccountButton />
            </section>

            <p className="pt-2 text-center text-xs text-cyan-200/55">
                <Link href="/terms" className="hover:text-cyan-200">Terms</Link>
                <span className="mx-2 opacity-40">·</span>
                <Link href="/privacy" className="hover:text-cyan-200">Privacy</Link>
                <SupportLink
                    label="Support ☕"
                    className="ml-2 border-l border-cyan-900/60 pl-2 hover:text-cyan-200"
                />
            </p>
        </div>
    );
}
