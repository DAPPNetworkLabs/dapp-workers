import React from 'react';
import classes from './Header.module.scss';
import { NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import { withLocalize } from 'react-localize-redux';

import * as logos from '@view/assets/logos'

import Button from '@components/UI/Button/Button';

import { MobileMenuToggleButton } from '@components/UI/MobileMenuToggleButton/MobileMenuToggleButton';

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
    langs: { 'en': 'English', 'zh': 'Chinese', 'ko': 'Korean', 'sp': 'Spanish' }
  }

  componentDidMount() {
    if (!this.state.isLangUserSelected) {
      let userlang = this.props.lang;
      if (userlang == 'en' || 'zh' || 'ko' || 'sp') {
        if (userlang == 'ko') {
          this.setKorean();
        } else if (userlang == 'zh') {
          this.setChinese();
        } else if (userlang == 'sp') {
          this.setSpanish();
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

  setSpanish = () => {
    this.props.setActiveLanguage('sp');
    this.props.setLang('sp');
    this.setState({ lang: 'Spanish', clicked: false });
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
      },
      {
        'text':'Spanish',
        'onClick': this.setSpanish
      }
    ]
    
    const menuItems = [
      {
        'text':'Consumer',
        'dropdown': [
          {
            'name': 'Worker Info',
            'path': '/consumer/worker-info'
          },
          {
            'name': 'Worker Images',
            'path': '/consumer/images'
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
            'name': 'Set Consumer',
            'path': '/consumer/set-consumer'
          },
          {
            'name': 'Set Workers',
            'path': '/consumer/set-workers'
          }
      ]
    },
    {
      'text':'Worker',
      'dropdown': [
        {
          'name': 'Jobs',
          'path': '/worker/jobs'
        },
        {
          'name': 'Services',
          'path': '/worker/services'
        },
        {
          'name': 'Register Worker',
          'path': '/worker/register'
        },
        {
          'name': 'Deprecate Worker',
          'path': '/worker/deprecate'
        },
        {
          'name': 'Register Image',
          'path': '/worker/register-image'
        },
        {
          'name': 'Update Image',
          'path': '/worker/update-image'
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

    if(this.props.isMobile && this.props.show) {
      body = (
      <div className={[this.props.isDayNight ? classes.containerMobileDay : classes.containerMobileNight,classes.open].join(' ')}>
        <div className={classes.flexOpen}>
          <NavLink to="/"><img className={classes.logoMobile} src={this.props.isDayNight ? logos.LogoBlack : logos.LogoWhite} alt="LiquidApps Logo"/></NavLink>
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
              show={this.props.show}
          ></Button>
          <Button 
              loginBtn={true}
              wide={false}
              onClick={this.props.account ? this.props.logout : this.props.login}
              text={this.props.account ? `${this.props.account.slice(0,4)}..${this.props.account.slice(-4)}` : 'Login'}
              isDayNight={this.props.isDayNight}
              show={this.props.show}
          ></Button>
        </div>
      </div>
      )
    } else if(this.props.isMobile) {
      body = (
        <>
          <div className={classes.flexForm}>
            <NavLink to="/"><img className={classes.logoMobile} src={this.props.isDayNight ? logos.LogoBlack : logos.LogoWhite} alt="LiquidApps Logo"/></NavLink>
            <MobileMenuToggleButton isDayNight={this.props.isDayNight} onToggleButtonClick={this.props.openClose} />
          </div>
        </>
      )
        } else {
      body = (
      <div className={classes.container}>
          <div>
            <NavLink to="/" className={this.props.isDayNight ?  '' : classes.logoNight}>
              <img className={classes.logo} src={this.props.isDayNight ? logos.LogoBlack : logos.LogoWhite} alt="LiquidApps Logo"/>
            </NavLink>
          </div>
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