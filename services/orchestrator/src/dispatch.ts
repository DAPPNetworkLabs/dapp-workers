const Docker = require('dockerode');
const Stream = require('stream');
const fetch =require('node-fetch');
import { execPromise } from './exec';

const { createUsageInfo } = require('./dal/dal')

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

    let data, dockerError;

    const p = new Promise((res, rej) => {
      const timeout = setTimeout(() => {
        console.log('first job timeout');
        rej('docker container took too long');
      }, killDelay);
  
      let dockerId
      
      // try {
        console.log('running docker here')
        docker.run(dockerImage,  [ipfsInput, ...args],  [writableStream, writableStream2],{
          Tty:false,
          AttachStdout: true,
          AttachStderr: true,
          HostConfig: { AutoRemove: false}}
        ).then((data) => {
          console.log(`res data here:`,data);
          clearTimeout(timeout);
          res(data);
        }).catch((e) => {
          console.log(`rej error here:`,e);
          rej(e);
        });
        console.log('stop running docker here')
      // } catch(e) {
      //   console.log(`docker error:`,e);
      //   rej(e);
      // }
    });

    await p.then(val => {
      data = val
    }).catch(e => {
      dockerError = e;
      console.log('hit e');
      return {stderr: error}
      // throw e;
    });
    const container = data[1];
    await container.wait();
    await container.remove();
    if(data[0].StatusCode != 0){
        console.log("error",error);
        dockerError = error
    }
    console.log("output",output);
    const lines = output.split("\n")
    const outputfs = lines[lines.length-2];
    return {stdOut:output,stderr: error, outputFS:outputfs,statusCode:data[0].StatusCode, dockerError}
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
  
  let dockerId
  
  try {
    dockerId = await execPromise(`docker run -v /var/run/docker.sock:/var/run/docker.sock --name  ${dockerImage}-${id} --rm -d --net=dapp-workers_default -p ${port}:${port} ${dockerImage} /bin/bash entrypoint.sh ${[ipfsInput, ...args].join(' ')}`,{});
  } catch(e) {
    console.log(`docker error:`,e);
    return { error:e };
  }
  console.log(`exec Promise res: ${dockerId}`);
  dockerMap[id] = {
    dockerId,
    ioUsed: 0,
    storageUsed: 0
  };
  
  await createUsageInfo(id, dockerId);
  
  clearTimeout(timeout);
  console.log('end dispatch service');
  
  return { port:port++ }
}