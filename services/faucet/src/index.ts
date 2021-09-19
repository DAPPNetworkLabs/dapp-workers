var svgCaptcha = require('svg-captcha');
const express = require('express');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var Tx = require('ethereumjs-tx');
import { getAccount } from './getAccount';
import { web3 } from './web3global';
const account = getAccount();
const private_key = account.privateKey;
const addr = account.address;
var app = express();
app.set('view engine', 'ejs')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({ secret: 'keyboard cat', cookie: { maxAge: 60000 }}))

// app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
   const captcha = svgCaptcha.create({ noise: 2, ignoreChars: 'iIlL' })
 
   req.session.captcha = captcha.text
 
   const message = req.session.message || ''
 
   req.session.message = null
   
   res.render('index', { captcha: captcha.data, message })
 })


app.post('/tokens', (req, res) => {
   const address = req.body.address;
   if (req.session.captcha === req.body.captcha) {
      
     req.session.message = 'OK'
   } else {
     req.session.message = 'WRONG'
   }
   // var gasPrice = 2;//or get with web3.eth.gasPrice
   var gasLimit = 3000000;

   var rawTransaction = {
      "from": addr,
      // "nonce": web3.toHex(nonce),
      // "gasPrice": web3.toHex(gasPrice * 1e9),
      "gasLimit": web3.utils.toHex(gasLimit),
      "to": address,
      "value": 10 ,
      "chainId": 4 //remember to change this
    };
    
        var privKey = new Buffer(private_key, 'hex');
        var tx = new Tx(rawTransaction);
    
        tx.sign(privKey);
        var serializedTx = tx.serialize();
    
        web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'), function(err, hash) {
          if (!err)
              {
                console.log('Txn Sent and hash is '+hash);
              }
          else
              {
                console.error(err);
              }
        });
    
   res.redirect('/')
 })
const port = process.env.PORT || 8080;
 app.listen(port, () => {
   console.log(`Faucet on http://localhost:${port}`)
 })