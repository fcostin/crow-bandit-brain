const path = require("path");

module.exports = {
  entry: {
    "demo-discrete-bandit": "./src/demo/discrete-bandit/index.js",
    "demo-linucb": "./src/demo/linucb/index.js",
    "demo-render-canvas": "./src/demo/render-canvas/index.js",
  },
  output: {
    path: __dirname + "/dist",
    filename: 'js/[name]-bundle.js',
  },
  resolve: {
    alias: {
      vue: "vue/dist/vue.min.js"
    }
  },
  optimization: {
    minimize: false
  },
};
