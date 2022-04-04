
import React, { Component } from 'react';
import classes from './RequestService.module.scss';
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
const page = 'request service'; // update

const ethereum = window.ethereum;

class RequestService extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            chainId: null,
            // update
            queueService: {
                owner: '0x21dfA04241ca05320E9dCd529F15f6F55115bbC3',
                imageName: 'wasi-service',
                ioMegaBytes: 100,
                storageMegaBytes: 100,
                inputFS: 'QmQSv2U14iRKDqBvJgJo1eixJWq6cTqRgY9QgAnBUe9fdM',
                args: ["target/wasm32-wasi/release/test"],
                months: 1
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

    componentWillUnmount() {
        //  lib.metamask.rmHandlers();
    }

    handleChange(event, func, valType) {	
        let { name, value, type } = event.target;	
        if(valType.includes('array')) {	
            value.includes(',') ? value = value.split(',') : value = [value];
            if(value.length && value[0] == '') value = [];	
        }	
        if(type == "checkbox") value = event.target.checked;	
        this.setState({	
            [func]: {	
                ...this.state[func],	
                [name]: value	
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
        // update
        {
            onClick:()=>lib.web3.queueService(this),
            buttonText:"Post Service",
            stateSelector:"queueService",
            inputs:[
                { name:"owner",placeholder: "address owner"},
                { name:"imageName",placeholder: "string imageName"},
                { name:"ioMegaBytes",placeholder: "uint ioMegaBytes"},
                { name:"storageMegaBytes",placeholder: "uint storageMegaBytes"},
                { name:"inputFS",placeholder: "string inputFS"},
                { name:"args",placeholder: "string[] args"},
                { name:"months",placeholder: "uint months"},
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
                    previewValues={this.separateObject(this.state.queueService)} // update
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
                    <div className={isMobile ? classes.centerMobile : classes.center}>
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
  
  export default connect(mapStateToProps, mapDispatchToProps)(withLocalize(RequestService));
  