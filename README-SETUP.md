# Propix Backend — Configuration Files

These files assume:
- Node.js `26.13.1` via NVM (`.nvmrc`)
- JavaScript with ES Modules (`"type": "module"` in `package.json`)
- Express.js backend in `src/`
- TypeScript is a future migration path, not the current runtime language

## Required package.json setting

```json
{
  "type": "module"
}
```

## Development dependencies

```bash
npm install -D eslint @eslint/js globals eslint-config-prettier prettier
```

For TypeScript support when you begin migrating:

```bash
npm install -D typescript @types/node
```

`jsconfig.json` provides editor IntelliSense and the `@/*` path mapping. Note that
Node.js does not resolve this alias automatically at runtime. Use relative imports
unless you add a runtime alias resolver or a build step.

`tsconfig.json` is a migration-ready TypeScript configuration and does not convert
or compile the current JavaScript backend.

`vite.config.js` is not an Express configuration. Vite is intended for a frontend
package only; remove this file from a backend-only repository, or move it to the
Vite frontend directory when one exists.

## Suggested scripts

```json
{
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "format": "prettier . --write",
    "format:check": "prettier . --check"
  }
}
```
