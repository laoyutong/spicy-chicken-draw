import { defineConfig } from "@rsbuild/core";
import { pluginLess } from "@rsbuild/plugin-less";
import { pluginReact } from "@rsbuild/plugin-react";

export default defineConfig({
  plugins: [pluginReact(), pluginLess()],
  resolve: {
    alias: {
      "@": "./src",
    },
  },
  output: {
    // 用于 github pages
    assetPrefix: "/spicy-chicken-draw/",
  },
  html: {
    title: "辣鸡绘图",
  },
  performance: { removeConsole: true },
});
