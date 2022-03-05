
import React, { Component } from 'react';
import classes from './BuyGas.module.scss';
import Header from '../../../components/Header/Header';
import Jobs from '../../../components/Home/Jobs/Jobs';
import Services from '../../../components/Home/Services/Services';
import Form from '../../../components/UI/Form/Form';
import Title from '../../../components/UI/Title/Title';
import SubTitle from '../../../components/UI/SubTitle/SubTitle';
import Footer from '../../../components/Footer/Footer';
import lib from '../../../lib/index';
import * as actions from '../../../store/actions/auth';
import { connect } from 'react-redux';
import { withLocalize } from 'react-localize-redux';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from '../../../view/css/theme';

import { GlobalStyles } from '../../../view/css/global';

const ethereum = window.ethereum;

class BuyGas extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            chainId: null,
            buyGasFor: {
                _amount:0,
                _consumer:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f',
                _dsp:'0xe26f809e5826fd8e1c0da1e6d9f308da9d86de4f'
            }
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
            onClick:()=>lib.web3.buyGasFor(this),
            buttonText:"BUY GAS",
            event:"buyGasFor",
            inputs:[
                { name:"_amount",placeholder: "uint256 _amount"},
                { name:"_consumer",placeholder: "address _consumer"},
                { name:"_dsp",placeholder: "address _dsp"},
            ],
            previews:[
                { name:"DAPP", type:"int"},
                { name:"Consumer", type:"address"},
                { name:"DSP", type:"address"}
            ],
            key:'DAPP'
        }
    ]
  
    render() {
        const forms = this.forms.map(el => {
            return (
                <Form
                    wide={true}
                    onClick={el.onClick}
                    onChange={this.handleChange}
                    buttonText={el.buttonText}
                    event={el.event}
                    inputs={el.inputs}
                    previews={el.previews}
                    isDayNight={this.props.isDayNight}
                    previewValues={this.separateObject(this.state.buyGasFor)}
                />
            )
        });
        return (
            <ThemeProvider theme={this.props.isDayNight ? lightTheme : darkTheme}>
                <GlobalStyles />
                <Header
                    login={()=>lib.metamask.login(this)}
                    logout={()=>lib.metamask.logout(this)}
                    account={this.state.account}
                />
                <div>
                    <div className="center">
                        <Title text="BUY GAS FOR DSP" isDayNight={this.props.isDayNight}/>
                        <SubTitle text="Provide amount, consumer address, and DSP account to fund a DSP to use DAPP Network jobs & services." isDayNight={this.props.isDayNight} />
                        {forms}
                    </div>
                </div>
                <Footer/>
            </ThemeProvider>
            // </div>
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
  
  export default connect(mapStateToProps, mapDispatchToProps)(withLocalize(BuyGas));
  