const Docker = require('dockerode');
const Stream = require('stream');
const fetch =require('node-fetch');
import { execPromise } from './web3global';

const kill = require('kill-port');

let dockerMap = {};

const killDelay = 1000 * 60 * 5; // 5m
let port = 9000;

export async function dispatch(dockerImage, ipfsInput, args): Promise<any> {
    console.log("running ", dockerImage,ipfsInput, args);
    const docker = new Docker();
    
    const writableStream = new Stream.Writable()
    let output = "";
    writableStream._write = (chunk, encoding, next) => {
        output += chunk.toString();
        next()
    }    
    const writableStream2 = new Stream.Writable()
    let error = "";
    writableStream2._write = (chunk, encoding, next) => {
        error += chunk.toString();
        next()
    }

    let data;

    const p = new Promise((res, rej) => {
      const timeout = setTimeout(() => {
        console.log('first job timeout');
        rej('docker container took too long');
      }, killDelay);
      docker.run(dockerImage,  [ipfsInput, ...args],  [writableStream, writableStream2],{
        Tty:false,
        AttachStdout: true,
        AttachStderr: true,
        HostConfig: { AutoRemove: false}}
      ).then((data) => {
        clearTimeout(timeout);
        res(data);
      }).catch((e) => {
        rej(e);
      });
    });

    console.log('before running job promise')

    await p.then(val => {
      data = val
    }).catch(e => {
      throw e;
    });

    console.log('after running job promise')
    const container = data[1];
    await container.wait();
    await container.remove();
    if(data[0].StatusCode != 0){
        console.log("error",error);    
    }
    console.log("output",output);
    const lines = output.split("\n")
    const outputfs = lines[lines.length-2];
    return {stdOut:output,stderr: error, outputFS:outputfs,statusCode:data[0].StatusCode}
}

const dockerrm = async (name) => {
  try {
    await execPromise(`docker rm -f ${name}`,{});
  }
  catch (e) {

  }
};

const killIfRunning = async (port) => {
  try {
    await kill(port);
  }
  catch (e) { }
};

export async function dispatchService(id, dockerImage, ipfsInput, args): Promise<any> {
  const docker = new Docker();
  console.log("running service", dockerImage,ipfsInput, args);

  const writableStream = new Stream.Writable()
  let output = "";
  writableStream._write = (chunk, encoding, next) => {
      output += chunk.toString();
      next()
  }
  
  const writableStream2 = new Stream.Writable()
  let error = "";
  writableStream2._write = (chunk, encoding, next) => {
      error += chunk.toString();
      next()
  }
  console.log('before running docker')

  let data;
  
  const timeout = setTimeout(() => {
    console.log('first service timeout');
  }, killDelay);
  
  const res = await execPromise(`docker run -v /var/run/docker.sock:/var/run/docker.sock --name  ${dockerImage}-${id} --rm -d --net=dapp-workers_default -p ${port}:${port} ${dockerImage} /bin/bash entrypoint.sh ${[ipfsInput, ...args].join(' ')}`,{});
  
  console.log(`exec Promise res: ${res}`);
  dockerMap[id].id = res;
  dockerMap[id].ioUsed = 0;
  dockerMap[id].storageUsed = 0;
  
  clearTimeout(timeout);
  console.log('end dispatch service');
  
  return { port:port++ }
}