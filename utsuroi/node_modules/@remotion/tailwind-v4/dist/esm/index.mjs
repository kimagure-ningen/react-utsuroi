import { createRequire } from "node:module";
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// src/enable.ts
var enableTailwind = (currentConfiguration) => {
  return {
    ...currentConfiguration,
    module: {
      ...currentConfiguration.module,
      rules: [
        ...((currentConfiguration.module?.rules) ? currentConfiguration.module.rules : []).filter((rule) => rule && rule !== "..." && !rule.test?.toString().includes(".css")),
        {
          test: /\.css$/i,
          use: [
            __require.resolve("style-loader"),
            __require.resolve("css-loader"),
            __require.resolve("postcss-loader")
          ]
        }
      ]
    }
  };
};
export {
  enableTailwind
};
