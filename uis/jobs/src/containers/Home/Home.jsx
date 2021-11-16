
import React, { Component } from 'react';
import classes from './Home.module.scss';
import Header from '../../components/Header/Header';
import Jobs from '../../components/Home/Jobs/Jobs';
import Footer from '../../components/Footer/Footer';
import lib from '../../lib/index';

const ethereum = window.ethereum;

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            jobs: []
        }
    }

    componentDidMount() {
        const accounts = ethereum.request({ method: 'eth_requestAccounts' });
        lib.web3.fetchJobs(this);
        this.setState({ account: accounts[0] });
    }
  
    render() {
        return (
            <div>
                <Header
                    login={()=>lib.metamask.login(this)}
                    logout={()=>lib.metamask.logout(this)}
                    account={this.state.account}
                />
                <Jobs
                    jobs={this.state.jobs}
                />
                <Footer/>
            </div>
        );
    }
  }
  
  export default Home;
  