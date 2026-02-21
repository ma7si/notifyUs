import { defineConfig } from "tsup";

export default defineConfig({
  entry: { sdk: "src/sdk/index.ts" },
  outDir: "public",
  format: ["iife"],
  globalName: "_notifyUsSDK",
  outExtension: () => ({ js: ".js" }),
  minify: true,
  clean: false,
  target: "es2018",
  platform: "browser",
  bundle: true,
});
