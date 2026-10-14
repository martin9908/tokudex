import { execFileSync, spawn } from "node:child_process";
const local = JSON.parse(
    execFileSync("npx", ["supabase", "status", "-o", "json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
    }),
);
if (!local.API_URL.startsWith("http://127.0.0.1:"))
    throw new Error("Only local Supabase is allowed for browser tests.");
const server = spawn(
    "npx",
    ["next", "dev", "--hostname", "127.0.0.1", "--port", "3100"],
    {
        stdio: "inherit",
        env: {
            ...process.env,
            NEXT_PUBLIC_SUPABASE_URL: local.API_URL,
            NEXT_PUBLIC_SUPABASE_ANON_KEY: local.ANON_KEY,
            SUPABASE_SERVICE_ROLE_KEY: local.SERVICE_ROLE_KEY,
            NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
            TOKUDEX_TEST_SERVER: "1",
        },
    },
);
for (const signal of ["SIGTERM", "SIGINT"])
    process.on(signal, () => server.kill(signal));
server.on("exit", (code) => process.exit(code ?? 0));
