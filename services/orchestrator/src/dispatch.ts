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
  
  /**
   * Get env list from running container
   * @param container
   */

    let data;
    
    const timeout = setTimeout(() => {
      console.log('first service timeout');
    }, killDelay);
    
    // await execPromise(`docker run --rm -ti -p 8000:80 -p 8443:443 --name pandorafms pandorafms/pandorafms:latest`);
    // docker run -v /var/run/docker.sock:/var/run/docker.sock --name  wasi-service-1 --rm -p 9000:9000 wasi-service /bin/bash entrypoint.sh QmQSv2U14iRKDqBvJgJo1eixJWq6cTqRgY9QgAnBUe9fdM target/wasm32-wasi/release/test
    const res = await execPromise(`docker run -v /var/run/docker.sock:/var/run/docker.sock --name  ${dockerImage}-${id} --rm -d --net=dapp-workers_default -p ${port}:${port} ${dockerImage} /bin/bash entrypoint.sh ${[ipfsInput, ...args].join(' ')}`,{});
    
    console.log(`exec Promise res: ${res}`);
    dockerMap[id] = res;
    
    clearTimeout(timeout);

    // const p = new Promise((res, rej) => {
    //   const timeout = setTimeout(() => {
    //     console.log('first service timeout');
    //     rej('docker container took too long');
    //   }, killDelay);
      
    //   await execPromise();
      
      // docker.createContainer({
      //   Image: dockerImage,
      //   Tty: true,
      //   Cmd: [ipfsInput, ...args],
      //   ExposedPorts: {
      //     [`${port.toString()}/tcp`]: {}
      //   },
      //   HostConfig : { 
      //     PortBindings: {
      //       [`${port.toString()}/tcp`]: [{
      //         HostPort: port.toString()
      //       }],
      //     },
      //     AutoRemove: true
      //   }
      // }, function (err, container) {
      //   console.log(`container: ${JSON.stringify(container)}`)
      //     dockerMap[id] = container.id;
      //     console.log('starting container');
      //     container.start();
      //     console.log('waiting on container');
      //     container.wait();
      //     console.log('done waiting on container');
      //   // container.start(function (err, data) {
      //   //   if(err) {
      //   //     console.log(err);
      //   //     clearTimeout(timeout);
      //   //     rej(err);
      //   //   }
      //   //   console.log(`container: ${typeof(data)=="object" ? JSON.stringify(data):data}`)
      //   //   clearTimeout(timeout);
      //   //   res(data);
      //   // //...
      //   // });
      // });
      
      // docker.run(dockerImage,  [ipfsInput, ...args],  [process.stdout, process.stderr],{
      //   Tty:false,
      //   AttachStdout: true,
      //   AttachStderr: true,
      //   ExposedPorts: {
      //     [`${port.toString()}/tcp`]: {
            
      //     }
      //   },
      //   NetworkSettings:{
      //     Ports: {
      //       [`${port.toString()}/tcp`]: [{
      //         HostIP: "0.0.0.0",
      //         HostPort: port.toString()
      //       }],
      //     },
      //   },
      //   HostConfig : { 
  
      //     PortBindings: {
      //       [`${port.toString()}/tcp`]: [{
      //         HostIP: "0.0.0.0",
      //         HostPort: port.toString()
      //       }],
      //     },
      //     AutoRemove: true
      //   }
      //   }, function (err, data, container) {
      //     console.log(err);
      //     // console.log(data.StatusCode);
      //     console.log(data);
      //     console.log(container);
      //     if(err) {
      //       clearTimeout(timeout);
      //       rej(err);
      //     }
      //     res(container.id);
      //   });
  
      // res(docker.run(dockerImage,  [ipfsInput, ...args],  [process.stdout, process.stderr],{
      //   Tty:false,
      //   AttachStdout: true,
      //   AttachStderr: true,
      //   ExposedPorts: {
      //     [`${port.toString()}/tcp`]: {
            
      //     }
      //   },
      //   NetworkSettings:{
      //     Ports: {
      //       [`${port.toString()}/tcp`]: [{
      //         HostIP: "0.0.0.0",
      //         HostPort: port.toString()
      //       }],
      //     },
      //   },
      //   HostConfig : { 
  
      //     PortBindings: {
      //       [`${port.toString()}/tcp`]: [{
      //         HostIP: "0.0.0.0",
      //         HostPort: port.toString()
      //       }],
      //     },
      //     AutoRemove: true}
      //   }
      // ));
      // res(runAndClear(timeout))
  
    // const options = {
    //   Cmd: ["bash","entrypoint.sh", ipfsInput, ...args],
    //   Env: [ipfsInput, ...args],
    //   AttachStdout: true,
    //   AttachStderr: true,
    //     ExposedPorts: {
    //       [`${port.toString()}/tcp`]: {}
    //     },
    //     HostConfig : { 
    //       PortBindings: {
    //         [`${port.toString()}/tcp`]: [{
    //           HostPort: port.toString()
    //         }],
    //       },
    //       AutoRemove: true
    //     }
    // };

    // console.log(options)
  
    //   docker.createContainer({
    //     Image: dockerImage,
    //     Tty: true,
    //     Cmd: ['/bin/bash']
    //   }, function(err, container) {
    //     container.start({}, function(err, data) {
    //       container.exec(options, function(err, exec) {
    //         if (err) {
    //           console.log(1);
    //           console.log(err);
    //           clearTimeout(timeout);
    //           rej(err);
    //         };
    //         exec.start(function(err, stream) {
    //           if (err) {
    //             console.log(2);
    //             console.log(err);
    //             clearTimeout(timeout);
    //             rej(err);
    //           };
        
    //           container.modem.demuxStream(stream, process.stdout, process.stderr);
        
    //           exec.inspect(function(err, data) {
    //             if (err) {
    //               console.log(3);
    //               console.log(err);
    //               clearTimeout(timeout);
    //               rej(err);
    //             };
    //             console.log('container data');
    //             console.log(data);
    //             dockerMap[id] = data.id;
    //             clearTimeout(timeout);
    //           });
    //         });
    //       });
    //     });
    //     container.wait();
    //     res('done');
    //   });
    // });

    // await p.then(val => {
    //   console.log(`after running service docker`)
    //   console.log(val)
    //   data = val
    // }).catch(e => {
    //   console.log(`service docker e: ${e}`)
    // });

  // console.log("container",container);
  // await container.start();
  // const container = data[1];
  // console.log("stdOut:",output, error,port);
  // todo: expose ports
  console.log('end dispatch service')

  // const response = await fetch(`http://0.0.0.0:9000`, {method: 'GET'});
  // const body = await response.text();

  // console.log("service body");
  // console.log(body);

  // const response2 = await fetch(`http://orchestrator:9000`, {method: 'GET'});
  // const body2 = await response2.text();

  // console.log("service body2");
  // console.log(body2);
  return { port:port++ }
}