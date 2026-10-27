# Mobile direction

Status: research recommendation, 2026-09-14. No mobile app is scaffolded in this release.

Recommend **Capacitor** for a future online-first app when reusing TokuDex's web interface is the priority. Choose **React Native with Expo** if native interaction quality becomes the primary goal and a separate screen implementation is acceptable. These conclusions are architectural judgments, not benchmark results or delivery estimates.

| Concern | Capacitor | React Native + Expo |
| --- | --- | --- |
| UI | Reuse browser React and CSS components after extracting client dependencies | Rebuild screens with native components |
| Shared code | UI portions, types, validation and pure domain logic | Types, validation and pure domain logic |
| Backend | Bundled client calls a hosted backend | Native client calls the same hosted backend |
| Maintenance | WebView/device testing, plugins and native projects | Native screen/navigation implementation, Expo/native dependency updates |
| Best fit | Web-first adaptation | Dedicated native product |

## Why neither option is a one-command conversion

The application uses request cookies, server rendering, Server Actions and request-dependent route handlers. The installed Next.js static-export guide lists cookies, Server Actions and request-dependent handlers as unsupported. Those features must remain hosted. Keep the existing Next.js web frontend; a future bundled Capacitor client would need client-side routes/data loading and shared components without server imports. React Native would consume the same backend contracts through new screens.

Capacitor's [development workflow](https://capacitorjs.com/docs/basics/workflow) bundles compiled web assets. Its [`server.url` configuration](https://capacitorjs.com/docs/config) is intended for live reload, not production. Do not treat a remote website wrapper as the production architecture.

React Native uses [native components](https://reactnative.dev/docs/components-and-apis), rather than the existing HTML/CSS components. Its [getting-started guidance](https://reactnative.dev/docs/environment-setup) recommends a framework such as Expo.

## Requirements for the later mobile project

- **Authentication:** use Supabase mobile sessions with platform-appropriate storage; keep service-role keys server-only. Define refresh, logout, account deletion and revoked-session behavior. Do not rely on browser cookies transferring automatically to the app.
- **Deep links:** configure app/universal links for password recovery, sign-in callbacks and public title/share URLs, including fallback to the website.
- **Mutation contracts:** wrap the existing authenticated database workflows in a shared client boundary. Preserve server-side permissions, atomic check-ins, trust expiry and rating eligibility. Do not call Next.js Server Actions as an undocumented native API.
- **Navigation:** define native back behavior, safe areas, keyboard handling, external-source links and authenticated routes.
- **Sharing:** use the device share sheet for the existing public share URLs; preserve public web previews.
- **Accessibility:** test screen readers, focus, large text, contrast, touch targets and reduced motion on physical devices.
- **Offline behavior:** default to online-only writes with explicit connection errors. Offline queues/conflict resolution require a separate decision and scope; neither framework provides that automatically.
- **Distribution:** establish signing, bundle IDs, store accounts, review requirements, privacy declarations and release/update procedures when an app build is authorized. Validate current store requirements at that time.

No mobile-only APIs, monorepo restructuring, native dependencies or offline synchronization were added for this research deliverable.
