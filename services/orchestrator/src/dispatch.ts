const Docker = require('dockerode');
const Stream = require('stream')


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

    // await docker.pull(dockerImage);
    

  
    const data = await docker.run(dockerImage,  [ipfsInput, ...args],  [writableStream, writableStream2],{Tty:false,
        AttachStdout: true,
        AttachStderr: true
        ,HostConfig: { AutoRemove: false}})        
    // var output = data[0];
    const container = data[1];
    // try{
    //     await container.wait();
    // }
    // catch(e){
    //     // already dead
    // }
    await container.wait();
    await container.remove();
    if(data[0].StatusCode != 0){
        console.log("error",error);    
        // throw error()
    }
    console.log("output",output);
    const lines = output.split("\n")
    const outputfs = lines[lines.length-2];
    return {stdOut:output,stderr: error, outputFS:outputfs,statusCode:data[0].StatusCode}
}

export async function dispatchService(dockerImage, ipfsInput, args): Promise<any> {
  const docker = new Docker();
  // job types (according to dockers)
  // compilers
  //   solidity compiler
  //   wasienv
  //   rust
  //   go
  // runner:
  //  wasm
  //  evm
  //  contract call
  // history to ipfs
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

  // await docker.pull(dockerImage);
  // const container = await docker.createContainer({Image:dockerImage, 
  //   Cmd: [ipfsInput, ...args],
  //   // Tty: true,
  //   HostConfig: {
  //       ExposedPorts: {
  //         [`${port.toString()}/tcp`]: {
            
  //         }
  //       },
  //       PortBindings: {
  //         ["8080/tcp"]: [{
  //          "HostPort": port.toString()
  //         }],
  //       },
  //       AutoRemove: true}
  //     });
    const data = docker.run(dockerImage,  [ipfsInput, ...args],  [process.stdout, process.stderr],{Tty:false,
      AttachStdout: true,
      AttachStderr: true,
      ExposedPorts: {
        "8080": {
          
        }
      },
      NetworkSettings:{
        Ports: {
          "8080": [{
            HostIP: "0.0.0.0",
           HostPort: "0"
          }],
        },
      },
      HostConfig : { 

        PortBindings: {
          "8080": [{
            HostIP: "0.0.0.0",
           HostPort: "0"
          }],
        },
        AutoRemove: true}
      }
        );

  // console.log("container",container);
  // await container.start();
  const container = data[1];
  // console.log("stdOut:",output, error,port);
  // todo: expose ports
  return { port:0}
}