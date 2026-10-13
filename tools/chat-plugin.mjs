import { createRequire } from 'node:module';
// Import only on the server. Provider credentials and knowledge never enter the browser bundle.
const require = createRequire(import.meta.url);
export default function chatPlugin() {
  const attach = server => {
    const { handleApi } = require('../server.js');
    server.middlewares.use((req, res, next) => {
      if (/^\/api\/(chat|health)\/?$/.test(req.url || '')) {
        req.url = req.url.replace(/\/$/, '');
        if (process.env.CHAT_BACKEND_TOKEN) req.headers.authorization = 'Bearer ' + process.env.CHAT_BACKEND_TOKEN;
        return handleApi(req, res, next);
      }
      next();
    });
  };
  return { name: 'oceanpower-chat-api', enforce: 'pre', configureServer: attach, configurePreviewServer: attach };
}
