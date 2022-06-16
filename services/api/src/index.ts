const { toMegaBytes, preCheck } = require('./lib');
const { execPromise } = require('./exec');

const nodeFetch = require('node-fetch');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 8050;

const approvedServices = [
    'git-cloner',
    'monte-carlo',
    'runner',
    'rust-compiler',
    'sol-runner',
    'wasi-service',
    'wasienv-compiler',
    'poa-evm'
];

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:false}));

const responseHandler = async (response, text) =>  {
    if(text && text.toString() == "true") {
        return await response.text();
    } else {
        return await response.json();
    }
}

app.get('/dapp-workers/io', async function(req, res, next) {
    try {
        const job = await getUsageInfo(req.query.id);
        const cmd = `docker stats --no-stream --format "{{.NetIO}}" ${job.dockerId}`;
        const ioInfo: any = await execPromise(cmd,{});
    
        const inputUsage = toMegaBytes(ioInfo.split(' / ')[0].replace(/[\n\r]/g, ''));
        const outputUsage = toMegaBytes(ioInfo.split(' / ')[1].replace(/[\n\r]/g, ''));
                
        res.send({
            io_usage: Math.floor((inputUsage + outputUsage) + job.last_io_usage)
        })
    } catch(e) {
        next(e);
    }
});

app.get('/dapp-workers/storage', async function(req, res, next) {
    try {
        const job = await getUsageInfo(req.query.id);
        const storageUsed: any = await execPromise(`docker ps --size --filter "id=${job.dockerId}" --format "{{.Size}}"`,{});
                
        res.send({
            storage_usage: Math.floor(toMegaBytes(storageUsed.split(' ')[0]))
        })
    } catch(e) {
        next(e);
    }
});

app.get('/dapp-workers', async function(req, res, next) {
    const port = req.query.port ? req.query.port : 80; 
    preCheck(approvedServices,req.query.image,res);
    try {
        // console.log(`url`,`http://${req.query.image}-${req.query.id}:${port}`);
        // console.log(`req.body`,req.body);
        // console.log(req.params);
        const response = await nodeFetch(`http://${req.query.image}-${req.query.id}:${port}`, {method: 'GET'});
                
        res.send(await responseHandler(response,req.query.text));
    } catch(e) {
        next(e);
    }
});

app.post('/dapp-workers', async function(req, res, next) {
    const port = req.query.port ? req.query.port : 80; 
    preCheck(approvedServices,req.query.image,res);
    try {
        // console.log(`url`,`http://${req.query.image}-${req.query.id}:${port}`);
        // console.log(`req.body`,req.body);
        const response = await nodeFetch(`http://${req.query.image}-${req.query.id}:${port}`, {
          method: 'POST', 
          body: req.body,
          headers: { "Content-Type": "application/json" }
        });
        
        res.send(await responseHandler(response,req.query.text));
    } catch(e) {
        next(e);
    }
});

// for testing
// app.get('/', function(req, res) {
//   res.send('Hello World!')
// });

app.listen(port, function() {
  console.log(`DAPP Workers Usage/Servie API running on ${port}!`)
});