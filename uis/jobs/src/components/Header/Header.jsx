import React from 'react';
import classes from './Header.module.scss';

import Logo from '../../assets/logo/logo.png';
import Button from '../../components/UI/Button/Button';

const header = (props) => {
  return (
    <div className={classes.container}>
        <div><img className={classes.logo} src={Logo} alt="LiquidApps Logo"/></div>
        <Button 
            login={props.login}
            logout={props.logout}
            account={props.account}
        ></Button>
    </div>
  );
};

export default header;
