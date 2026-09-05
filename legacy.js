import "./shared.js";
// Preserve links from the first preview; destinations are complete static HTML.
const project = new URLSearchParams(location.search).get("project");
if (["iam", "automation", "observability", "ai"].includes(project)) {
  location.replace(`./case-${project}.html`);
}
