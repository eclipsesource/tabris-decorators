const { resolve } = require('path');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: "./src/index.ts",
  externals: ['tabris', 'reflect-metadata'],
  output: {
    libraryTarget: 'commonjs2',
    filename: "dist/index.js",
  },
  resolve: { extensions: [".ts", ".tsx", ".js"] },
  module: {
    rules: [{ test: /\.tsx?$/, loader: "ts-loader" }]
  },
  plugins: [
    new UglifyJSPlugin()
  ]
};
