// Serves the front build to the Cypress run, like `sirv build --cors --single`,
// but closes the connection after each response.
//
// Cypress proxies every request of the app and keeps its connections to this
// server open, while Node closes a connection left idle for 5 seconds
// (server.keepAliveTimeout). When a page load comes about 5 seconds after the
// previous request, the proxy can send a request on a connection the server is
// closing at that very moment: the request is lost, a chunk of the app fails
// to load, the app never starts and the test times out waiting for its first
// API call. A connection that is never reused cannot be closed under a request.
const http = require('http');
const path = require('path');
const sirv = require('sirv');

const PORT = 1444;

const serveBuild = sirv(path.join(__dirname, '..', 'build'), {
  single: true,
  setHeaders: res => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Range');
  }
});

const server = http.createServer((req, res) => {
  res.setHeader('Connection', 'close');
  // one line per request, like sirv-cli: the CI logs show which files a page load got
  res.on('finish', () => {
    process.stdout.write(`  [${new Date().toISOString().substring(11, 19)}] ${res.statusCode} ─ ${req.url}\n`);
  });
  serveBuild(req, res);
});

server.listen(PORT, () => {
  process.stdout.write(`Front build served on http://localhost:${PORT}\n`);
});
