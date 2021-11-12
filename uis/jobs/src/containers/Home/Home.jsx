
import React, { Component } from 'react';
import classes from './Home.module.scss';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import lib from '../../lib/index';

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null
        }
    }
  
    render() {
        return (
            <div>
                <Header
                    login={()=>lib.metamask.login(this)}
                />
                <Footer/>
            </div>
        );
    }
  }
  
  export default Home;
  