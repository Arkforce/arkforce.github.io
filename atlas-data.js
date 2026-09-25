export const routes = [
  {
    id: 'iam', code: 'I', category: 'Identity & access', title: 'AWS IAM Role Factory',
    href: './case-iam.html',
    description: 'A small request interface. Shared trust and permission catalogs. Reviewable infrastructure changes.',
    stages: ['YAML request', 'Catalog validation', 'Generated policies', 'Terraform review'],
    labels: ['Request', 'Catalog', 'Policies', 'Review'],
  },
  {
    id: 'automation', code: 'A', category: 'Hybrid automation', title: 'Hybrid Infrastructure Automation',
    href: './case-automation.html',
    description: 'One parameterized workflow across VMware, Azure, and AWS. Platform-specific execution stays behind a consistent interface.',
    stages: ['Reviewed request', 'Bitbucket pipeline', 'Automation workflow', 'Platform execution'],
    labels: ['Request', 'Pipeline', 'Workflow', 'Platform'],
  },
  {
    id: 'observability', code: 'O', category: 'Observability', title: 'Multi-Account Observability',
    href: './case-observability.html',
    description: 'FSx signals across accounts and regions become a shared operational view of capacity, health, availability, and performance.',
    stages: ['AWS resources', 'CloudWatch telemetry', 'Grafana views', 'Operational checks'],
    labels: ['Resources', 'Telemetry', 'Grafana', 'Checks'],
  },
  {
    id: 'ai', code: 'AI', category: 'AI-assisted operations', title: 'AI-Assisted Incident Investigation',
    href: './case-ai.html',
    description: 'Splunk, Grafana, Microsoft Graph, and AWS context becomes summaries, hypotheses, and recommended checks. The engineer decides.',
    stages: ['Connected sources', 'Incident summary', 'Hypotheses & checks', 'Engineer decision'],
    labels: ['Sources', 'Summary', 'Hypotheses', 'Engineer'],
  },
];

// Independent lanes: geometric proximity does not claim a shared deployment.
export function stationPosition(routeIndex, stageIndex) {
  return [-5.25 + stageIndex * 3.5, 0, -3.6 + routeIndex * 2.4 + (stageIndex > 1 ? .45 : 0)];
}

export function getRoute(id) { return routes.find(route => route.id === id); }
