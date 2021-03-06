const { resolve } = require('path');

module.exports = {
  entry: "./src/index.ts",
  externals: ['tabris', 'reflect-metadata'],
  output: {
    libraryTarget: 'commonjs2',
    filename: "index.js",
  },
  resolve: {extensions: [".ts", ".tsx", ".js"]},
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: [{
        loader: 'ts-loader',
        options: {
          configFile: "tsconfig-build.json"
        }
      }],
      exclude: /node_modules/,
    }]
  },
  optimization: {
    minimize: false
  }
};
