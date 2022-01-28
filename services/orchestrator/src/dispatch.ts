const Docker = require('dockerode');
const Stream = require('stream')

let dockerMap = {};

const killDelay = 1000 * 60 * 3; // 3m

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
      setTimeout(() => {
        console.log('first job timeout');
        rej('docker container took too long');
      }, killDelay);
      docker.run(dockerImage,  [ipfsInput, ...args],  [writableStream, writableStream2],{Tty:false,
          AttachStdout: true,
          AttachStderr: true
          ,HostConfig: { AutoRemove: false}}).then((data) => {
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

export async function dispatchService(dockerImage, ipfsInput, args): Promise<any> {
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
      // Cmd: ['bash', '-c', 'echo test $VAR'],
      // Env: ['VAR=ttslkfjsdalkfj'],
      AttachStdout: true,
      AttachStderr: true
    };
  
    await container.exec(options, function(err, exec) {
      if (err) return;
      exec.start(function(err, stream) {
        if (err) return;
  
        container.modem.demuxStream(stream, process.stdout, process.stderr);
  
        exec.inspect(function(err, data) {
          if (err) return;
          console.log('container data');
          console.log(data);
          console.log('container');
          console.log(container);
        });
      });
    });
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

    let data;

    const p = new Promise((res, rej) => {
      setTimeout(() => {
        console.log('first service timeout');
        rej('docker container took too long');
      }, killDelay);
  
      res(docker.createContainer({
        Image: dockerImage,
        Tty: true,
        Cmd: [ipfsInput, ...args],
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
          AutoRemove: true
        }
      }, function(err, container) {

        container.start({}, function(err, data) {
          runExec(container);
        });
      }));
      // res(docker.run(dockerImage,  [ipfsInput, ...args],  [process.stdout, process.stderr],{Tty:false,
      //   AttachStdout: true,
      //   AttachStderr: true,
      //   ExposedPorts: {
      //     "8080": {
            
      //     }
      //   },
      //   NetworkSettings:{
      //     Ports: {
      //       "8080": [{
      //         HostIP: "0.0.0.0",
      //        HostPort: "0"
      //       }],
      //     },
      //   },
      //   HostConfig : { 
  
      //     PortBindings: {
      //       "8080": [{
      //         HostIP: "0.0.0.0",
      //        HostPort: "0"
      //       }],
      //     },
      //     AutoRemove: true}
      //   }
      //     ));
    });

    await p.then(val => {
      console.log(`after running service docker`)
      console.log(val)
      data = val
    }).catch(e => {
      console.log(`service docker e: ${e}`)
    });

    dockerMap[1] = data;

  // console.log("container",container);
  // await container.start();
  // const container = data[1];
  // console.log("stdOut:",output, error,port);
  // todo: expose ports
  console.log('end dispatch service')
  return { port:8080 }
}