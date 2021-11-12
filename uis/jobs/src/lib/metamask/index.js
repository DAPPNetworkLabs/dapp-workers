const ethereum = window.ethereum;

const login = async (thisObject) => {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    thisObject.setState({ account: accounts[0] });
}

export default { 
    login
}