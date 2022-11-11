const { toMegaBytes, preCheck } = require('./lib');
const { execPromise } = require('./exec');

const nodeFetch = require('node-fetch');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 8050;

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

app.get('/dapp-workers', async function(req, res, next) {
    const port = req.query.port ? req.query.port : 80; 
    await preCheck(req.query.image,res);
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
    await preCheck(req.query.image,res);
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

app.get('/health', function(req, res) {
  res.send('alive')
});

app.listen(port, function() {
  if(!process.env.IPFS_HOST) throw new Error('requires IPFS HOST');
  if(!process.env.ETH_ADDR) throw new Error('requires EVM HOST');
  if(!process.env.ADDRESS) throw new Error('requires Nexus ADDRESS');
  console.log(`DAPP Workers Usage/Servie API running on ${port}!`);
});