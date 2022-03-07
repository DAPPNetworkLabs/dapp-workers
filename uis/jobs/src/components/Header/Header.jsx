import React from 'react';
import { NavLink } from 'react-router-dom';
import classes from './Header.module.scss';
import { connect } from 'react-redux';
import { withLocalize, Translate } from 'react-localize-redux';

import LogoWhite from '@view/assets/logos/logo-white.png';
import LogoBlack from '@view/assets/logos/logo-black.png';
import Button from '@components/UI/Button/Button';

import { MobileMenuToggleButton } from '@components/UI/MobileMenuToggleButton/MobileMenuToggleButton';

import TelegramPNG from '@view/assets/icons/newTelegram.png';
import close from '@view/assets/icons/close.png';

import classNames from 'classnames';
// import { loc } from '@texts/links';

import * as helpers from '@helpers'

import * as actions from '@auth';
import detectBrowserLanguage from 'detect-browser-language';

class Header extends React.Component {
  constructor(props) {
    super(props);
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
    const langItems = [
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
    
    const menuItems = [
      {
        'text':'Consumer',
        'dropdown': [
          {
            'name': 'Buy Gas',
            'path': '/consumer/buy-gas'
          },
          {
            'name': 'Sell Gas',
            'path': '/consumer/sell-gas'
          },
          {
            'name': 'Request Job',
            'path': '/consumer/request-job'
          },
          {
            'name': 'Request Service',
            'path': '/consumer/request-service'
          },
          {
            'name': 'Extend Service',
            'path': '/consumer/extend-service'
          },
          {
            'name': 'Jobs',
            'path': '/consumer/jobs'
          },
          {
            'name': 'Services',
            'path': '/consumer/services'
          },
          {
            'name': 'Set Consumer',
            'path': '/consumer/set-consumer'
          },
          {
            'name': 'Set DSPs',
            'path': '/consumer/set-dsps'
          }
      ]
    },
    {
      'text':'DSP',
      'dropdown': [
        {
          'name': 'Register DSP',
          'path': '/dsp/register'
        },
        {
          'name': 'Deprecate DSP',
          'path': '/dsp/deprecate'
        },
        {
          'name': 'Register DSP',
          'path': '/dsp/register'
        },
        {
          'name': 'Update DSP',
          'path': '/dsp/update'
        },
        {
          'name': 'Jobs',
          'path': '/dsp/jobs'
        },
        {
          'name': 'Services',
          'path': '/dsp/services'
        }
      ]
    },
    {
      'text':'Admin',
      'dropdown': [
        {
          'name': 'Set Config',
          'path': '/admin/set-config'
        },
        {
          'name': 'Approve Image',
          'path': '/admin/approve-image'
        },
        {
          'name': 'Unapprove Image',
          'path': '/admin/unapprove-image'
        }
      ]
    }
    ]
    
    const text = `${this.state.lang}`;

    let body;

    if(helpers.isMobile() && this.props.show) {
      console.log('hello 222')
      body = (
      <div className={[this.props.isDayNight ? classes.containerMobileDay : classes.containerMobileNight,classes.open].join(' ')}>
        <div className={classes.flexOpen}>
          <img className={classes.logoMobile} src={this.props.isDayNight ? LogoBlack : LogoWhite} alt="LiquidApps Logo"/>
          <MobileMenuToggleButton isDayNight={this.props.isDayNight} onToggleButtonClick={this.props.openClose} />
        </div>
        <div className={classes.mobileButtons}>
          <Button 
              wide={false}
              text={text}
              isDayNight={this.props.isDayNight}
              menuItems={menuItems}
              anchor={true}
          ></Button>
          <Button 
              wide={false}
              text={text}
              isDayNight={this.props.isDayNight}
              dropDownItems={langItems}
          ></Button>
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
      )
    } else if(helpers.isMobile()) {
      console.log('hello here')
      body = (
        <>
          <div className={classes.flex}>
            <img className={classes.logoMobile} src={this.props.isDayNight ? LogoBlack : LogoWhite} alt="LiquidApps Logo"/>
            <MobileMenuToggleButton isDayNight={this.props.isDayNight} onToggleButtonClick={this.props.openClose} />
          </div>
        </>
      )
    } else {
      console.log('hello here234324')
      body = (
      <div className={classes.container}>
        <div><img className={classes.logo} src={this.props.isDayNight ? LogoBlack : LogoWhite} alt="LiquidApps Logo"/></div>
          <div className={classes.dropdown}>
            <Button 
                wide={false}
                text={text}
                isDayNight={this.props.isDayNight}
                menuItems={menuItems}
                anchor={true}
            ></Button>
          </div>
        <div className={classes.headerButtons}>
          <div className={classes.dropdown}>
            <Button 
                wide={false}
                text={text}
                isDayNight={this.props.isDayNight}
                dropDownItems={langItems}
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
      )
    }
    return (
      <>
        {body}
      </>
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