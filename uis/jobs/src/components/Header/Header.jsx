import React from 'react';
import classes from './Header.module.scss';
import { connect } from 'react-redux';
import { withLocalize } from 'react-localize-redux';

import LogoWhite from '../../assets/logo/logo-white.png';
import LogoBlack from '../../assets/logo/logo-black.png';
import Button from '../../components/UI/Button/Button';

import * as actions from '../../store/actions/auth';
import detectBrowserLanguage from 'detect-browser-language';

class Header extends React.Component {
  constructor(props) {
    super(props);
    // this.handleClick = this.handleClick.bind(this);
  }

  state = {
    isDayNight: 'en',
    lang: 'English',
    isLangUserSelected: this.props.isLangUserSelected,
    langs: { 'en': 'English', 'zh': 'Chinese', 'ko': 'Korean' }
  }

  // componentDidMount() {
  //   if (!this.state.isLangUserSelected) {
  //     let userlang = detectBrowserLanguage().substring(0,2);
  //     if (userlang == 'en' || 'zh' || 'ko') {
  //       if (userlang == 'ko') {
  //         this.props.setKorean();
  //       } else if (userlang == 'zh') {
  //         this.props.setChinese();
  //       } else {
  //         this.props.setEnglish();
  //       }
  //     }
  //     else { 
  //       this.props.setEnglish();
  //     }
  //   } else {
  //     this.props.setActiveLanguage(this.props.lang); 
  //   }
  // }

  // TODO: refactor to use one lang function (setLanguage(lang, code))
  setEnglish = () => {
    this.props.setActiveLanguage('en');
    this.props.setLang('en');
    this.setState({ lang: 'English', clicked: false });
  }

  setChinese = () => {
    this.props.setActiveLanguage('zh');
    this.props.setLang('zh');
    this.setState({ lang: 'Chinese', clicked: false });
  }

  setKorean = () => {
    this.props.setActiveLanguage('ko');
    this.props.setLang('ko');
    this.setState({ lang: 'Korean', clicked: false });
  }

  render() {
    return (
      <div className={classes.container}>
          <div><img className={classes.logo} src={this.props.day ? LogoBlack : LogoWhite} alt="LiquidApps Logo"/></div>
          <Button 
              login={this.props.login}
              logout={this.props.logout}
              account={this.props.account}
          ></Button>
      </div>
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
    setIsDayNight: (lang) => dispatch(actions.setIsDayNight(lang)),
    setLang: (lang) => dispatch(actions.setLang(lang)),
    setIsLangUserSelected: (isLangUserSelected) => dispatch(actions.setIsLangUserSelected(isLangUserSelected))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withLocalize(Header));