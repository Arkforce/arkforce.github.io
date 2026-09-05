export const profiles = {
  "claims-bucket-read-only": ["s3:GetObject", "s3:ListBucket"],
  "claims-bucket-read-write": [
    "s3:GetObject",
    "s3:ListBucket",
    "s3:PutObject",
    "s3:DeleteObject",
  ],
};

export function evaluateRequest({ role, trust, permission }) {
  if (typeof role !== "string" || !/^[a-zA-Z0-9_+=,.@-]{1,64}$/.test(role)) {
    return {
      ok: false,
      message:
        "Use a role name of 1–64 characters: letters, numbers, or _+=,.@-.",
    };
  }
  if (!["ec2", "lambda"].includes(trust)) {
    return {
      ok: false,
      message: "This demo catalog supports EC2 and Lambda trust profiles.",
    };
  }
  if (!Object.hasOwn(profiles, permission)) {
    return {
      ok: false,
      message:
        "Request blocked. Administrator access is outside this demo’s approved catalog. Select a scoped bucket profile.",
    };
  }
  const policy = {
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { Service: `${trust}.amazonaws.com` },
        Action: "sts:AssumeRole",
      },
    ],
  };
  // Placeholder bucket; action/resource separation follows the repository templates.
  const bucket = "arn:aws:s3:::example-claims-bucket";
  const permissions = {
    Version: "2012-10-17",
    Statement: [
      { Effect: "Allow", Action: "s3:ListBucket", Resource: bucket },
      {
        Effect: "Allow",
        Action: profiles[permission].filter(
          (action) => action !== "s3:ListBucket",
        ),
        Resource: `${bucket}/*`,
      },
    ],
  };
  const plan = [
    "ILLUSTRATIVE PLAN — NOT TERRAFORM OUTPUT",
    "",
    `+ IAM role: ${role}`,
    `+ Trust: ${trust}.amazonaws.com`,
    `+ Permission profile: ${permission}`,
    ...profiles[permission].map((action) => `    ${action}`),
    "+ Resource scope: example claims bucket only",
    ...(trust === "ec2" ? ["+ EC2 instance profile"] : []),
    "",
    "Next: review policy scope and approve the change.",
    "Nothing has been deployed.",
  ].join("\n");
  return {
    ok: true,
    message:
      "Request accepted by the demo catalog. Review who can assume the role, its bucket permissions, and the plan summary.",
    policy: JSON.stringify(policy, null, 2),
    permissions: JSON.stringify(permissions, null, 2),
    plan,
  };
}

export function requestYaml({ role, trust, permission }) {
  return `name: ${JSON.stringify(role)}\ntrust: ${trust}\npermissions:\n  - ${permission}\nowner: claims-platform`;
}
