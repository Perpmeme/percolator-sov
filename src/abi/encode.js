// Bridge file: re-export from encode.ts for .js import compatibility
// The percolator-cli source uses .js extensions in imports (TypeScript ESM style)
// This file ensures webpack resolves ./encode.js correctly
export * from "./encode.ts";
