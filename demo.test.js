import test from "node:test";
import assert from "node:assert/strict";
import { evaluateRequest, requestYaml } from "./demo.js";

const base = {
  role: "claims-app-readonly",
  trust: "ec2",
  permission: "claims-bucket-read-only",
};

test("service trust allows only the selected service to assume the role", () => {
  for (const trust of ["ec2", "lambda"]) {
    const result = evaluateRequest({ ...base, trust });
    assert.equal(result.ok, true);
    assert.deepEqual(JSON.parse(result.policy).Statement, [
      {
        Effect: "Allow",
        Principal: { Service: `${trust}.amazonaws.com` },
        Action: "sts:AssumeRole",
      },
    ]);
    assert.equal(result.plan.includes("EC2 instance profile"), trust === "ec2");
  }
});

test("read-only permissions separate bucket listing from object access", () => {
  const result = evaluateRequest(base);
  const [bucket, objects] = JSON.parse(result.permissions).Statement;
  assert.equal(bucket.Action, "s3:ListBucket");
  assert.equal(bucket.Resource, "arn:aws:s3:::example-claims-bucket");
  assert.deepEqual(objects.Action, ["s3:GetObject"]);
  assert.equal(objects.Resource, "arn:aws:s3:::example-claims-bucket/*");
});

test("read/write/delete profile includes the documented object operations", () => {
  const result = evaluateRequest({
    ...base,
    permission: "claims-bucket-read-write",
  });
  const objects = JSON.parse(result.permissions).Statement[1];
  assert.deepEqual(objects.Action, [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject",
  ]);
  assert.equal(objects.Resource, "arn:aws:s3:::example-claims-bucket/*");
});

test("rejected permissions never generate deployable output", () => {
  for (const permission of [
    "administrator",
    "unknown",
    "__proto__",
    "toString",
  ]) {
    const result = evaluateRequest({ ...base, permission });
    assert.equal(result.ok, false);
    assert.equal(result.policy, undefined);
    assert.equal(result.permissions, undefined);
    assert.equal(result.plan, undefined);
  }
});

test("reject malformed role names and unsupported trust", () => {
  for (const role of [
    "",
    undefined,
    null,
    "role with spaces",
    "x".repeat(65),
    "<script>",
  ]) {
    assert.equal(evaluateRequest({ ...base, role }).ok, false);
  }
  assert.equal(evaluateRequest({ ...base, role: "x".repeat(64) }).ok, true);
  assert.equal(evaluateRequest({ ...base, trust: "unknown" }).ok, false);
});

test("request YAML quotes names that YAML could otherwise interpret as booleans", () => {
  assert.match(requestYaml({ ...base, role: "true" }), /^name: "true"\n/);
});
