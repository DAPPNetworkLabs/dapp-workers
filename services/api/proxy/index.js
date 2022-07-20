// works, but does not work with CORS

const http = require('http');
const httpProxy = require('http-proxy');
var targetURL = process.env.TARGET_URL || 'http://3.87.133.109:8888';

const proxy = httpProxy.createProxyServer({});
var enableCors = function(req, res) {
        if (req.headers['access-control-request-method']) {
                res.setHeader('access-control-allow-methods', req.headers['access-control-request-method']);
        }

        if (req.headers['access-control-request-headers']) {
                res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']);
        }

        if (req.headers.origin) {
                res.setHeader('access-control-allow-origin', req.headers.origin);
                res.setHeader('access-control-allow-credentials', 'true');
        }
};
// set header for CORS
proxy.on("proxyRes", function(proxyRes, req, res) {
        enableCors(req, res);
});
proxy.on('error', function (err, req, res) {
  //proxyReq.setHeader("Access-Control-Allow-Origin", "*");
  //proxyReq.setHeader("Access-Control-Allow-Methods", "GET, PUT, PATCH, POST, DELETE");
  //proxyReq.setHeader("Access-Control-Allow-Headers", req.header('access-control-request-headers'));
  if (err) {
    //logger.error('proxy error:');
    //logger.error(err);
          console.error('proxy error:');
          console.error(err);
  }
  if (!res) { return; }
  res.writeHead(500, {
    'Content-Type': 'text/plain'
  });

  res.end(`DSP Proxy error: ${err}`);
});
http.createServer(function(req, res) {
  console.log('Request', req.method, targetURL);
  return proxy.web(req, res, { target: targetURL });
}).listen(8000);
