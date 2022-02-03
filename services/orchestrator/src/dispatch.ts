const Docker = require('dockerode');
const Stream = require('stream')

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
  async function runExec(container) {
  
    const options = {
      Cmd: ["/bin/bash","entrypoint.sh", ipfsInput, ...args],
      Env: [ipfsInput, ...args],
      AttachStdout: true,
      AttachStderr: true
    };

    console.log(options)
  
    await container.exec(options, function(err, exec) {
      if (err) {
        console.log(1);
        console.log(err);
        return
      };
      exec.start(function(err, stream) {
        if (err) {
          console.log(2);
          console.log(err);
          return
        };
  
        container.modem.demuxStream(stream, process.stdout, process.stderr);
  
        exec.inspect(function(err, data) {
          if (err) {
            console.log(3);
            console.log(err);
            return
          };
          console.log('container data');
          console.log(data);
          dockerMap[id] = data.id;
        });
      });
    });
  }

    let data;

    const runAndClear = async (timeoutInstance) => {
      await docker.createContainer({
        Image: dockerImage,
        Tty: true,
        Cmd: [ipfsInput, ...args],
        ExposedPorts: {
          [`${port.toString()}/tcp`]: {}
        },
        // HostConfig : { 
        //   PortBindings: {
        //     [`${port.toString()}/tcp`]: [{
        //       HostPort: port.toString()
        //     }],
        //   },
        //   AutoRemove: true
        // }
      }, function(err, container) {
        console.log('container');
        console.log(container);
        dockerMap[id] = container.ID;
        console.log('container err');
        console.log(err);
        container.start(function(err, data) {
          console.log('container data');
          console.log(data);
          console.log('container error');
          console.log(err);
          // runExec(container);
        });
        console.log(typeof(dockerMap) =="object" ? JSON.stringify(dockerMap) : dockerMap)
      });
      clearTimeout(timeoutInstance);
    }

    const p = new Promise((res, rej) => {
      const timeout = setTimeout(() => {
        console.log('first service timeout');
        rej('docker container took too long');
      }, killDelay);
      
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
      //         HostPort: [`${port.toString()}/tcp`]
      //       }],
      //     },
      //   },
      //   HostConfig : { 
  
      //     PortBindings: {
      //       [`${port.toString()}/tcp`]: [{
      //         HostIP: "0.0.0.0",
      //         HostPort: [`${port.toString()}/tcp`]
      //       }],
      //     },
      //     AutoRemove: true}
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
      //   }).then(function(data) {
      //     clearTimeout(timeout);
      //     res(data);
      //     console.log('container removed');
      //   });
  
      res(docker.run(dockerImage,  [ipfsInput, ...args],  [process.stdout, process.stderr],{Tty:false,
        AttachStdout: true,
        AttachStderr: true,
        ExposedPorts: {
          [`${port.toString()}/tcp`]: {
            
          }
        },
        NetworkSettings:{
          Ports: {
            [`${port.toString()}/tcp`]: [{
              HostIP: "0.0.0.0",
            HostPort: [`${port.toString()}/tcp`]
            }],
          },
        },
        HostConfig : { 
  
          PortBindings: {
            [`${port.toString()}/tcp`]: [{
              HostIP: "0.0.0.0",
            HostPort: [`${port.toString()}/tcp`]
            }],
          },
          AutoRemove: true}
        }
      ));
      // res(runAndClear(timeout))
    });

    await p.then(val => {
      console.log(`after running service docker`)
      console.log(val)
      data = val
    }).catch(e => {
      console.log(`service docker e: ${e}`)
    });

  // console.log("container",container);
  // await container.start();
  // const container = data[1];
  // console.log("stdOut:",output, error,port);
  // todo: expose ports
  console.log('end dispatch service')
  return { port:port++ }
}