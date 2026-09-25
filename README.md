# arkforce.github.io

Aziz Khodzhaev's infrastructure, platform, and AI-assisted operations portfolio, built with Three.js and Vite. One production design is served at https://arkforce.github.io/.

## Run locally

```bash
npm ci
npm run dev
```

The homepage is `index.html`. Four static `case-*.html` pages contain the full case studies and remain readable without JavaScript. `work.html` preserves the original preview's query links and provides a project directory. Old homepage case-study anchors redirect to their corresponding pages.

The Systems atlas design uses `style.css`, with self-hosted Barlow Semi Condensed and Hanken Grotesk fonts and Phosphor icons. `atlas-data.js` defines four separate project routes. `atlas.js` connects the accessible selector, static diagram, and case-study links; `topology.js` progressively enhances the diagram with a demand-rendered Three.js model.

Choose a route to isolate its workflow. Plan view changes the perspective; Play flow starts an explicitly illustrative traveling marker. Nothing auto-rotates or intercepts scrolling. Rendering stops offscreen or in a hidden tab. Reduced-motion mode disables playback and makes selection immediate. Mobile starts in plan view. Without JavaScript, all case studies and the initial diagram remain readable; without WebGL, all route controls still work. The theme follows the system until the visitor chooses a light/dark override.

The previous working tree, including uncommitted typography experiments, was preserved in a local archive outside the repository. The archive is not published. Design direction and review notes live under `.impeccable/` and are not build inputs.

## Checks and deployment

```bash
npm test
npm run build
npm run preview
```

GitHub Actions runs tests and builds pull requests. A push to `main` also deploys the compiled `dist/` artifact to GitHub Pages. The repository's Pages build source is GitHub Actions. Generated files, dependency folders, and previous design previews are not published.

## IAM demonstration

The local demo accepts or rejects sample role requests and produces service trust policies, scoped S3 permissions, and an illustrative plan summary. Read/write access includes object deletion, matching the source repository's example. No AWS resources are created and no credentials are requested. This limited browser demo is not a substitute for the Terraform factory's validation.

Telemetry graphics are labeled illustrations. Case-study figures reuse the documented portfolio results. Contact: khodzhaev@gmail.com.
