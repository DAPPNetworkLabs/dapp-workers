const ethereum = window.ethereum;

const login = async (thisObject) => {
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    thisObject.setState({ account: accounts[0] });
}

const logout = async (thisObject) => {
    thisObject.setState({ account: null });
}

export default { 
    login,
    logout
}