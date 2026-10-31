# wessel.xyz

A self-hosted portfolio and small browser-based project editor. The public portfolio uses the original React frontend and styling. The editor stores project content in SQLite and images on disk.

## Run locally

Requires Node.js 22.13 or newer. Run `npm ci` and `npm --prefix frontend ci`, then `npm --prefix frontend run build`.

```sh
ADMIN_PASSWORD='choose-a-long-unique-password' npm start
```

For Coolify with Authentik, set `AUTHENTIK_ISSUER` to the application issuer URL, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and `OIDC_REDIRECT_URI` to the exact public callback URL ending in `/auth/callback`. Optionally set `OIDC_ALLOWED_GROUP` to an Authentik group name. The app discovers Authentik’s authorization and token endpoints from `${AUTHENTIK_ISSUER}/.well-known/openid-configuration`, uses authorization code plus PKCE, and keeps the admin session in an HttpOnly cookie. When these OIDC variables are present, password login is disabled.

Open http://localhost:3000/admin and sign in. Add a project, write its story, upload images, preview, and save a draft or publish. A published project appears on the homepage at `/projects/<slug>`. Saving changes to a published project as a draft keeps the existing page live until you publish the revision. The editor uses the MIT-licensed MediumEditor library for inline rich text, floating formatting controls, headings, lists, quotes, and links. Image uploads and cover images are supported. It is inspired by Medium; it is not Medium’s proprietary editor.

## Coolify

Deploy this repository using the Dockerfile. Set `ADMIN_PASSWORD` to a strong unique secret and set `NODE_ENV=production`. Expose port 3000 through HTTPS. Mount a persistent volume at `/data`, writable by UID 1000 (the container's `node` user). SQLite and uploads both live there; without a persistent volume, redeployments can lose content. Back up the entire `/data` directory using a SQLite-aware backup or while the app is stopped, and test restoring it. Do not expose the application over plain HTTP in production: the admin session cookie requires HTTPS. Sessions are held in memory and expire after 12 hours or on restart.

The portfolio starts empty so projects can be added intentionally through the admin interface. Cards open full project pages. Story settings support tags, contributor credits, project links such as GitHub or itch.io, and a header gallery whose first image is used for the homepage card; the editor’s + menu inserts images, editable carousels with captions and descriptions, code blocks, and dividers.

Code blocks have an explicit language selector and a live highlighted preview. Click an existing code block to edit it. Highlight.js (BSD-3-Clause) renders syntax highlighting on the server for published pages and preview. Unknown languages fall back to plain text.

Project pages share the homepage’s Nunito Sans typography and white-on-charcoal framing, with an article layout, screenshot gallery, and contributor credits. In **Story settings → Authors & collaborators**, add each author’s name and optional role and profile URL. Credits are included in previews, drafts, and published pages; changes saved as a draft stay private until published.

When a published project is edited, **Save draft** stores the changes separately and leaves the live page unchanged. The admin list marks it as having draft changes and provides a basic diff viewer. Publishing replaces the live version and clears the pending draft.
