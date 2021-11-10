import logo from './logo.svg';
import './App.css';
import Web3 from 'web3';
import NexusJSON from '../../../services/orchestrator/artifacts/contracts/Nexus.sol/Nexus.json'

const fetchJobs = async () => {
  const web3 = new Web3(Web3.givenProvider || "ws://localhost:8545");
  const contract = new web3.eth.Contract(NexusJSON,address)
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
