import "dotenv/config";
import { createServer as createViteServer, type ViteDevServer } from "vite";
import { type Server } from "node:http";
import { type Express } from "express";
import runApp from "./app";

export async function injectViteMiddleware(
  app: Express,
  server: Server,
) {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);

  // handle all requests that are not api routes
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = await vite.transformIndexHtml(
        url,
        `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InfinityTrain</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      );

      res.status(200).set({ "Content-Type": "text/html" }).end(clientTemplate);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

(async () => {
  await runApp(injectViteMiddleware);
})();
