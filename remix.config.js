const { withEsbuildOverride } = require("remix-esbuild-override");
const styledComponentsPlugin = require("./styled-components-esbuild-plugin");

withEsbuildOverride((option) => {
  option.plugins.unshift(styledComponentsPlugin());

  return option;
});

/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverBuildTarget: "netlify",
  server:
    process.env.NETLIFY || process.env.NETLIFY_LOCAL
      ? "./server.js"
      : undefined,
  ignoredRouteFiles: ["**/.*"],
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: ".netlify/functions-internal/server.js",
  // publicPath: "/build/",
};
