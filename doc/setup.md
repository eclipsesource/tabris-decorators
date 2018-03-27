# Setup

Generate a Tabris.js TypeScript project using the [Tabris CLI](https://www.npmjs.com/package/tabris-cli):

`tabris init`

For existing projects, note that Tabris.js 2.4.2 or later is required.

Install the `tabris-decorators module`:

`npm install tabris-decorators`.

Then edit `tsconfig.json` to enable the compiler options `experimentalDecorators` and `emitDecoratorMetadata`. The final file could look like this:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es6",
    "outDir": "./dist/",
    "lib": [
      "es6",
      "es2015.promise",
      "es2017"
    ],
    "jsx": "react",
    "jsxFactory": "JSX.createElement",
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
  },
  "include": [
    "./src/**/*.ts",
    "./src/**/*.tsx"
  ]
}
```
