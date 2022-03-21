
import React, { Component } from 'react';
import classes from './Home.module.scss';
import Header from '@components/Header/Header';
import WorkerStats from '@components/UI/WorkerStats/WorkerStats';
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

const section = 'home'; // update
const page = 'home'; // update
const stateSelector = 'worker stats'

const ethereum = window.ethereum;

class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            chainId: null,
            // update
            [stateSelector]: {
                workers:null,
                gasPaid:null
            },
            show: false
        }
    }

    componentDidMount() {
        lib.web3.fetchWorkerStats(this, stateSelector);
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
  
    render() {
        const isMobile = helpers.isMobile();
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
                        <div className={classes.buttonFlex}>
                            <a className={this.props.isDayNight ? classes.day : classes.night} target="_blank" rel="noreferrer" href="https://docs.liquidapps.io/liquidapps-documentation/">
                                {loc(`${section}.${page}.buttonOne`,this.props.lang)}
                            </a>
                            <span className={classes.horizontalSpace}></span>
                            <a className={this.props.isDayNight ? classes.day : classes.night} target="_blank" rel="noreferrer" href="https://docs.liquidapps.io/liquidapps-documentation/">
                                {loc(`${section}.${page}.buttonTwo`,this.props.lang)}
                            </a>
                        </div>
                        <WorkerStats
                            workers={this.state[stateSelector].workers}
                            gasPaid={this.state[stateSelector].gasPaid}
                        ></WorkerStats>
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
  
  export default connect(mapStateToProps, mapDispatchToProps)(withLocalize(Home));
  