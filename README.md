# arkforce.github.io

Aziz Khodzhaev's infrastructure, platform, and AI-assisted operations portfolio, built with Three.js and Vite. One production design is served at https://arkforce.github.io/.

## Run locally

```bash
npm ci
npm run dev
```

The homepage is `index.html`. Four static `case-*.html` pages contain the full case studies and remain readable without JavaScript. `work.html` preserves the original preview's query links and provides a project directory. Old homepage case-study anchors redirect to their corresponding pages.

Shared styling is in `style.css`; the Three.js scene is in `topology.js`. Desktop scrolling reveals the system connections. Mobile and reduced-motion views show a static, fully connected topology. An SVG fallback remains available without WebGL.

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
