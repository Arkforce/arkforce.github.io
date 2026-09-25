const previousCases = {
  "#automation-case-study": "./case-automation.html",
  "#configuration-case-study": "./case-iam.html",
  "#observability-case-study": "./case-observability.html",
  "#ai-case-study": "./case-ai.html",
};
if (Object.hasOwn(previousCases, location.hash))
  location.replace(previousCases[location.hash]);
if (location.hash === "#method") location.replace("#practice");
if (location.hash === "#home") location.replace("#main");

import { evaluateRequest, requestYaml } from "./demo.js";
import "./shared.js";

const form = document.querySelector("#request-form");
if (form) {
  const output = document.querySelector("#generated-output");
  const status = document.querySelector("#validation-message");
  const state = document.querySelector("#output-state");
  const panel = document.querySelector(".demo-output");
  const copy = document.querySelector("#copy-output");
  const copyMessage = document.querySelector("#copy-message");
  document.querySelector("#validate-button").disabled = false;
  let result = null;
  let activeOutput = "policy";
  const read = () => ({
    role: form.elements.role.value,
    trust: form.elements.trust.value,
    permission: form.elements.permission.value,
  });
  function refresh() {
    document.querySelector("#yaml-preview").textContent = requestYaml(read());
    result = null;
    state.textContent = "READY";
    panel.classList.remove("invalid");
    status.textContent =
      "Validate the request to inspect its trust policy and proposed changes.";
    output.textContent = "// Your reviewed output appears here.";
    copy.disabled = true;
    copyMessage.textContent = "";
  }
  function showOutput() {
    output.textContent = result?.ok
      ? result[activeOutput]
      : "// No policy or plan generated. Resolve the validation issue first.";
    copy.disabled = !result?.ok;
    copyMessage.textContent = "";
  }
  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    result = evaluateRequest(read());
    panel.classList.toggle("invalid", !result.ok);
    state.textContent = result.ok ? "ACCEPTED" : "BLOCKED";
    status.textContent = result.message;
    showOutput();
  });
  document.querySelectorAll("[data-output]").forEach((button) => {
    button.addEventListener("click", () => {
      activeOutput = button.dataset.output;
      document.querySelectorAll("[data-output]").forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle("selected", selected);
        tab.setAttribute("aria-pressed", String(selected));
      });
      if (result) showOutput();
    });
  });
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      form.elements.permission.value =
        button.dataset.preset === "blocked"
          ? "administrator"
          : "claims-bucket-read-only";
      refresh();
      form.requestSubmit();
    });
  });
  copy.addEventListener("click", async () => {
    const text = output.textContent;
    try {
      await navigator.clipboard.writeText(text);
      if (output.textContent === text)
        copyMessage.textContent = "Output copied.";
    } catch {
      copyMessage.textContent = "Select the output below and copy it manually.";
      output.focus();
    }
  });
  refresh();
}

import "./atlas.js";
