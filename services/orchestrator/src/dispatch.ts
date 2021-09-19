var Docker = require('dockerode');
const Stream = require('stream')

export function sum(a: number, b: number): number {
    return a + b;
}
function runExec(container) {

    var options = {
      Cmd: ['bash', '-c', 'echo test $VAR'],
      Env: ['VAR=ttslkfjsdalkfj'],
      AttachStdout: true,
      AttachStderr: true
    };
  
    container.exec(options, function(err, exec) {
      if (err) return;
      exec.start(function(err, stream) {
        if (err) return;
  
        container.modem.demuxStream(stream, process.stdout, process.stderr);
  
        exec.inspect(function(err, data) {
          if (err) return;
          console.log(data);
        });
      });
    });
  }
  

export async function dispatch(dockerImage, ipfsInput, args): Promise<any> {
    console.log("running ", dockerImage,ipfsInput, args);
    var docker = new Docker();
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
    var container = data[1];
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
