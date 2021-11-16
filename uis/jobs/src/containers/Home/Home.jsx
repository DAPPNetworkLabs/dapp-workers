
import React, { Component } from 'react';
import classes from './Home.module.scss';
import Header from '../../components/Header/Header';
import Jobs from '../../components/Home/Jobs/Jobs';
import RunJob from '../../components/Home/RunJob/RunJob';
import Footer from '../../components/Footer/Footer';
import lib from '../../lib/index';

const ethereum = window.ethereum;

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            jobs: [],
            form: {
                consumer: '0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f',
                imageName: 'rust-compiler',
                inputFS: 'QmUm1JD5os8p6zu6gQBPr7Rov2VD6QzMeRBH5j4ojFBzi6',
                args: [],
            }
        }
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        const accounts = ethereum.request({ method: 'eth_requestAccounts' });
        lib.web3.fetchJobs(this);
        this.setState({ account: accounts[0] });
    }

    handleChange(event) {
        const { name, value } = event.target;
        const { form } = this.state;
        this.setState({
            form: {
                ...form,
                [name]: value,
                error: '',
            },
        });
        console.log(this.state.form)
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
                <RunJob
                    runJob={()=>lib.web3.runJob(this.state.form)}
                    onChange={this.handleChange}
                />
                <Footer/>
            </div>
        );
    }
  }
  
  export default Home;
  