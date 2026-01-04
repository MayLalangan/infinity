import "dotenv/config";
import fs from "node:fs";
import { type Server } from "node:http";
import path from "node:path";

import express, { type Express, type Request } from "express";

import runApp from "./app";

export async function serveStatic(app: Express, server: Server) {
  // Try multiple paths for the static files (for pkg bundled exe)
  const possiblePaths = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(process.cwd(), "client/dist"),
    path.resolve(path.dirname(process.execPath), "client/dist"),
  ];

  let distPath = possiblePaths[0];
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      distPath = testPath;
      break;
    }
  }

  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory. Tried: ${possiblePaths.join(', ')}`);
    throw new Error(
      `Could not find the build directory, make sure to build the client first`,
    );
  }

  console.log(`Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

(async () => {
  await runApp(serveStatic);
})();
