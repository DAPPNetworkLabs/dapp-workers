/**************************************************************************************************
 * This sample demonstrates the most simplistic usage of Swagger Express Middleware.
 * It simply creates a new Express Application and adds all of the Swagger middleware
 * without changing any options, and without adding any custom middleware.
 **************************************************************************************************/
'use strict';

const createMiddleware = require('@apidevtools/swagger-express-middleware');
const path = require('path');
const express = require('express');
var url = require('url');
var fs = require('fs');
var yaml = require('js-yaml');

import { WASI } from "@wasmer/wasi";
import { lowerI64Imports } from "@wasmer/wasm-transformer"
import { WasmFs } from "@wasmer/wasmfs";

// Create an Express app
const app = express();

// Initialize Swagger Express Middleware with our Swagger file
let swaggerFile = path.join("/tmp1", 'swagger.yaml');
let wasmFile = path.resolve(process.argv[2]);
let wasmmodule;
const loadwasm = async ()=>{  
  const wasmBuffer = fs.readFileSync(wasmFile);
  let wasmBinary = new Uint8Array(wasmBuffer);
  wasmBinary = await lowerI64Imports(wasmBinary);
  wasmmodule = await WebAssembly.compile(wasmBinary);
  
}
const startWasiTask = async (wasi) => {
  let instance:any = await WebAssembly.instantiate(wasmmodule, {
    ...wasi.getImports(wasmmodule)
  });          
  wasi.start(instance);

  // Output what's inside of /dev/stdout!
  
};

createMiddleware(swaggerFile, app, (err, middleware) => {

  // Add all the Swagger Express Middleware, or just the ones you need.
  // NOTE: Some of these accept optional options (omitted here for brevity)
  app.use(
    middleware.metadata(),
    middleware.CORS(),
    middleware.files(),
    middleware.parseRequest(),
    middleware.validateRequest(),
    // middleware.mock()
  );
  loadwasm().then(async()=>{
    console.log("loaded wasm")
    // for each endpoint in swagger file (.paths):
    const doc = yaml.load(fs.readFileSync(swaggerFile, 'utf8'));
    console.log("loaded doc")
    const endpointPaths = Object.keys(doc.paths);
    // console.log(process.argv);
    // console.log(process.argv[3]);
    // console.log(typeof(process.argv[3]));
    
    endpointPaths.forEach(endpointPath => {
      console.log("endpointPath",doc.basePath+ endpointPath)
      app.all(doc.basePath+ endpointPath, async function(req, res, next) {
        console.log("handling...")
        // run wasi        
        // Instantiate a new WASI Instance
        var url_parts = url.parse(req.url, true);
        var query = url_parts.query || "";
        const wasmFs = new WasmFs();

        const headers= Object.keys(req.headers).map(k=>`${k}: ${req.headers[k]}`).join("\n");
          let wasi = new WASI({
            args: ["wasmFile","query",req.body.toString(),headers,"req.method", endpointPath, "req.url"],
            env: {},
            preopens:{".":".","/":"/"},
            bindings: {
              // uses browser APIs in the browser, node APIs in node
              ...WASI.defaultBindings,
              fs: wasmFs.fs
            }
          });
          
          await startWasiTask(wasi);
          const stdout = await wasmFs.getStdOut();
          console.log(stdout);
          res.send(stdout);
        });
      });
      app.get('/', function (req, res) {
          res.send('foo');
      });
      app.listen(9000, '0.0.0.0', () => {
        console.log(`running at http://0.0.0.0:${9000}`);
      });
    })
});