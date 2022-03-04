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
    isDayNight: true,
    lang: 'English',
    isLangUserSelected: this.props.isLangUserSelected,
    langs: { 'en': 'English', 'zh': 'Chinese', 'ko': 'Korean' }
  }

  componentDidMount() {
    if (!this.state.isLangUserSelected) {
      let userlang = detectBrowserLanguage().substring(0,2);
      if (userlang == 'en' || 'zh' || 'ko') {
        if (userlang == 'ko') {
          this.setKorean();
        } else if (userlang == 'zh') {
          this.setChinese();
        } else {
          this.setEnglish();
        }
      }
      else { 
        this.setEnglish();
      }
    } else {
      this.props.setActiveLanguage(this.props.lang); 
    }
  }

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
    const dropDownItems = [
      {
        'text':'English',
        'onClick': this.setEnglish
      },
      {
        'text':'Chinese',
        'onClick': this.setChinese
      },
      {
        'text':'Korean',
        'onClick': this.setKorean
      }
    ]
    const text = `${this.state.lang}`
    return (
      <div className={classes.container}>
          <div><img className={classes.logo} src={this.props.isDayNight ? LogoBlack : LogoWhite} alt="LiquidApps Logo"/></div>
          <div className={classes.headerButtons}>
            <div className={classes.dropdown}>
              <Button 
                  wide={false}
                  text={text}
                  // onClick={this.props.setIsDayNight}
                  isDayNight={this.props.isDayNight}
                  dropDownItems={dropDownItems}
              ></Button>
            </div>
            <Button 
                wide={false}
                text={this.props.isDayNight ? 'Night' : 'Day'}
                onClick={this.props.setIsDayNight}
                isDayNight={this.props.isDayNight}
            ></Button>
            <Button 
                loginBtn={true}
                wide={false}
                onClick={this.props.account ? this.props.logout : this.props.login}
                text={this.props.account ? `${this.props.account.slice(0,4)}..${this.props.account.slice(-4)}` : 'Login'}
                isDayNight={this.props.isDayNight}
            ></Button>
          </div>
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
    setIsDayNight: () => dispatch(actions.setIsDayNight()),
    setLang: (lang) => dispatch(actions.setLang(lang)),
    setIsLangUserSelected: (isLangUserSelected) => dispatch(actions.setIsLangUserSelected(isLangUserSelected))
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(withLocalize(Header));