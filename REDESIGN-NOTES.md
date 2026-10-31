# Portfolio rebuild notes

## Decisions

- Build a custom, self-hosted portfolio and browser-based editor instead of adopting a CMS.
- FOSS is a requirement. The first implementation uses Node.js built-ins and browser APIs without third-party packages.
- Deploy using Coolify, with SQLite and image uploads on persistent storage.
- Keep individual project URLs and server-render the public pages to avoid client-side content pop-in.

## First implementation

The new branch replaces the original React/Express site with a small Node application. It includes password-based admin access, project drafts and publishing, a block editor, image uploads, and preview. The original project content and assets remain available in Git history on `main` but have not been imported.

## Follow-up work

- Improve the writing experience toward a Medium-style editor: inline formatting, links, image descriptions, and more comfortable block editing.
- Add Markdown import and decide how to support existing Mermaid diagrams and code formatting.
- Migrate the existing projects and assets, and verify their content.
- Improve draft/published versioning so edits to a published page can remain private until republished.
- Add image dimension metadata, responsive image processing, and richer accessibility controls.
- Establish and test a Coolify deployment, backup and restore workflow, and production authentication safeguards.

## Design correction

The public portfolio must retain the original design exactly. The original React components, CSS, assets, and project dialogs have been restored. The editor now uses MIT-licensed MediumEditor with a quiet inline writing surface and floating formatting toolbar. Existing file-based projects are displayed but still need migration into the database to become editable. Do not redesign the public site without an explicit request.

## Rich project pages

Cards now open full shareable project pages instead of dialogs. The homepage styling is retained. Tags and inline image carousels are supported; carousel images have editable captions and alt text, can be reordered, and have previous/next controls in preview and on public pages. Code blocks and dividers are also available in the insertion menu. Content remains sanitized on the server.

## Syntax highlighting

Use Highlight.js (BSD-3-Clause) for language-specific code highlighting. Code blocks persist their selected language and can be reopened for editing. Both preview and public pages use the same server-side highlighting function; original Markdown language fences are supported.

## Draft revisions

Published projects keep pending edits in a separate `project_drafts` table. Saving a draft never changes the public page. The admin list marks pending changes and offers a simple line-oriented diff viewer. Publishing applies the draft and removes the pending revision.

## Authentication

The admin supports Authentik through generic OpenID Connect authorization code plus PKCE. Configure the issuer, client ID, client secret, exact callback URL, and optionally an allowed group in Coolify environment variables. Local password login remains available only when OIDC is not configured.
