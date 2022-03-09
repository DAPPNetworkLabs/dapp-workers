
import React, { Component } from 'react';
import classes from './SellGas.module.scss';
import Header from '@components/Header/Header';
import Form from '@components/UI/Form/Form';
import Title from '@components/UI/Title/Title';
import SubTitle from '@components/UI/SubTitle/SubTitle';
import Footer from '@components/Footer/Footer';
import lib from '@lib';
import * as actions from '@auth';
import { connect } from 'react-redux';
import { withLocalize } from 'react-localize-redux';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '@view/css/theme';

import { GlobalStyles } from '@view/css/global';
import { loc } from '@loc';

import * as helpers from '@helpers'

const section = 'consumer'; // update
const page = 'sell gas'; // update

const ethereum = window.ethereum;

class SellGas extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            chainId: null,
            // update
            sellGas: {
                _amountToSell:null,
                _dsp:''
            },
            show: false
        }
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        const accounts = ethereum.request({ method: 'eth_requestAccounts' });
        lib.web3.fetchJobs(this);
        lib.web3.fetchServices(this);
        lib.metamask.runHandlers(this);
        this.setState({ account: accounts[0] });
    }

    componentWillUnmount() {
        lib.metamask.rmHandlers();
    }

    handleChange(event, func) {
        const { name, value } = event.target;
        this.setState({
            [func]: {
                ...this.state[func],
                [name]: value,
                error: '',
            },
        });
    }

    openClose = () => {
      this.setState({ show: !this.state.show });
    }
    
    separateObject = obj => {
        const res = [];
        const keys = Object.keys(obj);
        keys.forEach(key => {
           res.push({
              key: obj[key]
           });
        });
        return res;
     };
     

    forms = [

        {
            onClick:()=>lib.web3.sellGas(this),
            event:"sellGas",
            inputs:[
                { name:"_amountToSell",placeholder: "uint256 _amountToSell"},
                { name:"_dsp",placeholder: "address _dsp"},
            ],
            previews:[
                { name:"DAPP", type:"dapp"},
                { name:"DSP", type:"address"}
            ],
            key:'DAPP'
        }
    ]
  
    render() {
        const isMobile = helpers.isMobile();
        const forms = this.forms.map(el => {
            return (
                <Form
                    wide={true}
                    onClick={el.onClick}
                    onChange={this.handleChange}
                    buttonText={loc(`${section}.${page}.button`,this.props.lang)}
                    event={el.event}
                    inputs={el.inputs}
                    previews={el.previews}
                    isDayNight={this.props.isDayNight}
                    previewValues={this.separateObject(this.state.sellGas)} // update
                    isMobile={isMobile}
                    openClose={this.openClose}
                    show={this.state.show}
                />
            )
        });
        return (
            <ThemeProvider theme={this.props.isDayNight ? lightTheme : darkTheme}>
                <div className={classes.flex}>
                    <GlobalStyles />
                    <Header
                        login={()=>lib.metamask.login(this)}
                        logout={()=>lib.metamask.logout(this)}
                        account={this.state.account}
                        openClose={this.openClose}
                        show={this.state.show}
                        isMobile={isMobile}
                    />
                    <div className="center">
                        <Title text={loc(`${section}.${page}.title`,this.props.lang)} isDayNight={this.props.isDayNight}/>
                        <SubTitle text={loc(`${section}.${page}.subtitle`,this.props.lang)} isDayNight={this.props.isDayNight} />
                        {forms}
                    </div>
                    <Footer
                        isDayNight={this.props.isDayNight}
                        isMobile={isMobile}
                    />
                </div>
            </ThemeProvider>
        );
    }
  }

  const mapStateToProps = state => {
    return {
      isDayNight: state.isDayNight,
      lang: state.lang,
      isLangUserSelected: state.isLangUserSelected
    };
  };
  
  const mapDispatchToProps = dispatch => {
    return {
      setIsDayNight: () => dispatch(actions.setIsDayNight()),
      setLang: (lang) => dispatch(actions.setLang(lang)),
      setIsLangUserSelected: (isLangUserSelected) => dispatch(actions.setIsLangUserSelected(isLangUserSelected))
    };
  };
  
  export default connect(mapStateToProps, mapDispatchToProps)(withLocalize(SellGas));
  