const ethereum = window.ethereum;

const login = async (thisObject) => {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    thisObject.setState({ account: accounts[0] });
}

const logout = async (thisObject) => {
    thisObject.setState({ account: null });
}

const handleConnect = (thisObject) => {
    ethereum.on('connect', (connectInfo) => {
        thisObject.setState({ connectInfo });
    });
}

const handleDisconnect = (thisObject) => {
    ethereum.on('disconnect', (error) => {
        thisObject.setState({ disconnectInfo:error });
    });
}

const handleAccountChange = (thisObject) => {
    ethereum.on('accountsChanged', (account) => {
        thisObject.setState({ account });
    });
}

const handleChainChange = (thisObject) => {
    ethereum.on('chainChanged', (chainId) => {
        thisObject.setState({ chainId });
    });
}

const runHandlers = (thisObject) => {
    handleConnect(thisObject);
    handleDisconnect(thisObject);
    handleAccountChange(thisObject);
    handleChainChange(thisObject);
}

const rmHandlers = () => {
    ethereum.removeListener('connect', handleConnect);
    ethereum.removeListener('disconnect', handleDisconnect);
    ethereum.removeListener('accountsChanged', handleAccountChange);
    ethereum.removeListener('chainChanged', handleChainChange);
}

export default { 
    login,
    logout,
    runHandlers,
    rmHandlers
}