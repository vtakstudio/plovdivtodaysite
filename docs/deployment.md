# Automatic production deployments

Cloudflare Workers Builds connects `vtakstudio/plovdivtodaysite` to the existing `plovdivtodaysite` Worker. Every push to `main` triggers a build and production deployment. This connection was already active; both foundation commit `3c13472` and design commit `619f189` deployed automatically.

The build settings are managed in the [Worker dashboard](https://dash.cloudflare.com/5bae2a39ee6a674d65c6382110ebec30/workers/services/view/plovdivtodaysite/production/settings#builds):

| Setting | Value |
| --- | --- |
| Repository | `vtakstudio/plovdivtodaysite` |
| Production branch | `main` |
| Root directory | `/` |
| Build command | `corepack pnpm typecheck && corepack pnpm build` |
| Deploy command | `corepack pnpm exec wrangler deploy` |
| Build cache | Enabled |
| Authentication | Existing Cloudflare-managed build token |

Cloudflare installs dependencies from the repository. Corepack uses the pnpm version pinned in `package.json`; `pnpm-lock.yaml` records dependency versions. The checks and Astro build run before deployment, so a failed build leaves the previous deployment live. The deploy command uses Astro’s generated Wrangler configuration and does not rebuild the site a second time.

The existing Worker name, D1 database, R2 media bucket, session KV, image binding, runtime variables and cron stay attached to the same site. This workflow deploys code; it does not import or reset CMS content. Publishing content through EmDash does not require a Git push.

After pushing, check **Deployments → Recent builds** in the Worker dashboard. Open a build for its commit, logs and result. Once successful, the new version serves the [production site](https://plovdivtodaysite.estudio-5ba.workers.dev/). A GitHub Action is unnecessary while this native integration is active; adding another deployment pipeline would duplicate deployments.

For an intentional manual deployment, `corepack pnpm deploy` still builds and deploys from the local checkout. Routine releases only need a push to `main`.

## Verification and references

A clean checkout without local secrets or database files passed frozen-lockfile installation, Astro check (30 files, zero errors/warnings/hints), and the production build on 2 October 2026. The saved Cloudflare commands were updated to include typecheck and eliminate the previous duplicate build.

- [Cloudflare Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/)
- [Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [Build image and package versions](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/)
- [EmDash deployment on Cloudflare](https://docs.emdashcms.com/deployment/cloudflare/)
