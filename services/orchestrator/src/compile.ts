const solc = require('solc');
const fs = require('fs');
const path = require('path');
export function readFileCallback(sourcePath) {
    // if (options.basePath)
      sourcePath = path.resolve('.',sourcePath);
    if (fs.existsSync(sourcePath)) {
      try {
        return { 'contents': fs.readFileSync(sourcePath).toString('utf8') }
      } catch (e) {
        return { error: 'Error reading ' + sourcePath + ': ' + e };
      }
    } else
      return { error: 'File not found at ' + sourcePath}
  }
export const compile = async () => {
    const source = fs.readFileSync(path.resolve('.', 'contracts/Nexus.sol'), 'utf8');
    const input = {
        language: 'Solidity',
        sources: {
            'Nexus.sol': {
                content: source,
            },
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*'],
                },
            },
        },
    };
    const callbacks = { 'import': readFileCallback };
    const tempFile = JSON.parse(solc.compile(JSON.stringify(input), callbacks));
    if (tempFile.errors) {
        console.log(tempFile.errors);
        // throw new Error("compilation failed");
    }
    return await tempFile.contracts['Nexus.sol']['Nexus'];
};
