import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL("./index.html", import.meta.url)),
        work: fileURLToPath(new URL("./work.html", import.meta.url)),
        ...Object.fromEntries(
          ["iam", "automation", "observability", "ai"].map((key) => [
            key,
            fileURLToPath(new URL(`./case-${key}.html`, import.meta.url)),
          ]),
        ),
      },
    },
  },
});
