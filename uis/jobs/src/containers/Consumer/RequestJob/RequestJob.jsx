
import React, { Component } from 'react';
import classes from './RequestJob.module.scss';
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
const page = 'request job'; // update
const stateSelector = 'queueJob'

const ethereum = window.ethereum;

class RequestJob extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            chainId: null,
            // update
            [stateSelector]: {
                owner: '0x21dfA04241ca05320E9dCd529F15f6F55115bbC3',
                imageName: 'natpdev/rust-compiler',
                inputFS: 'QmSvEfc84PKhxgguqwP8NQn2VN2yJhSHxek4AyVd1STKvu',
                callback: false,
                gasLimit: 1000000,
                requireConsistent: false,
                args: [],
                sufficientGas: true,
                totalDapps: null
            },
            show: false
        }
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount() {
        try {
            const accounts = ethereum.request({ method: 'eth_requestAccounts' });
            this.setState({ account: accounts[0] });
        } catch (e) {
            console.log(`unable to load metamask`,e);
        }
    }

    handleChange(event, func, valType) {
        let { name, value, type } = event.target;
        if(valType.includes('array')) {
            
            value.includes(',') ? value = value.split(',') : value = [value];
            if(value.length && value[0] == '') value = [];
            if(value.length && value[0] == '') value = [];
        }
        if(type == "checkbox") value = event.target.checked;
        this.setState({
            [func]: {
                ...this.state[func],
                [name]: value
            },
        });
        lib.web3.fetchJobDapps(this, stateSelector);
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
            onClick:()=>lib.web3.queueJob(this),
            stateSelector:"queueJob",
            inputs:[
                { name:"owner",placeholder: "address owner"},
                { name:"imageName",placeholder: "string imageName"},
                { name:"inputFS",placeholder: "string inputFS"},
                { name:"callback",placeholder: "bool callback"},
                { name:"gasLimit",placeholder: "uint gasLimit"},
                { name:"requireConsistent",placeholder: "bool requireConsistent"},
                { name:"args",placeholder: "string[] args"}
            ]
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
                    stateSelector={el.stateSelector}
                    inputs={el.inputs}
                    previews={loc(`${section}.${page}.previews`,this.props.lang)}
                    isDayNight={this.props.isDayNight}
                    previewValues={this.separateObject(this.state.queueJob)} // update
                    isMobile={isMobile}
                    openClose={this.openClose}
                    show={this.state.show}
                />
            )
        });
        let dappGasElem;
        if(this.state[stateSelector].totalDapps) {
            dappGasElem = (
                <SubTitle text={`${loc(`${section}.${page}.dappGas`,this.props.lang)}: ${this.state[stateSelector].totalDapps/1e4} DAPP`} isDayNight={this.props.isDayNight} />
            )
        }
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
                    <div className={isMobile ? classes.centerMobile : classes.center}>
                        <Title text={loc(`${section}.${page}.title`,this.props.lang)} isDayNight={this.props.isDayNight}/>
                        <SubTitle text={loc(`${section}.${page}.subtitle`,this.props.lang)} isDayNight={this.props.isDayNight} />
                        {forms}
                        {dappGasElem}
                        <SubTitle text={this.state[stateSelector].sufficientGas ? '' : loc(`${section}.${page}.sufficientGas`,this.props.lang)} isDayNight={this.props.isDayNight} theme="red" />
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
  
  export default connect(mapStateToProps, mapDispatchToProps)(withLocalize(RequestJob));
  