
import React, { Component } from 'react';
import classes from './WorkerInfo.module.scss';
import Header from '@components/Header/Header';
import Workers from '@components/UI/Workers/Workers';
import AllWorkers from '@components/UI/AllWorkers/AllWorkers';
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
const page = 'worker info'; // update
const stateSelector = 'workers'; // update

const ethereum = window.ethereum;

class WorkerInfo extends Component {
    constructor(props) {
        super(props);
        this.state = {
            account: null,
            chainId: null,
            // update
            [stateSelector]: {
                lastJobId: 0,
                workers: null,
                allWorkerInfo: null
            },
            show: false
        }
    }

    componentDidMount() {
        lib.web3.fetchWorkersByConsumer(this,stateSelector);
        lib.web3.fetchAllWorkers(this,stateSelector);
    }

    openClose = () => {
      this.setState({ show: !this.state.show });
    }
  
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
                        <Workers
                            workers={this.state[stateSelector].workers}
                            isMobile={isMobile}
                            lang={this.props.lang}
                        />
                        <SubTitle text={loc(`${section}.${page}.altSubtitle`,this.props.lang)} isDayNight={this.props.isDayNight} />
                        <AllWorkers
                            allWorkerInfo={this.state[stateSelector].allWorkerInfo}
                            isMobile={isMobile}
                            lang={this.props.lang}
                        />
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
  
  export default connect(mapStateToProps, mapDispatchToProps)(withLocalize(WorkerInfo));
  