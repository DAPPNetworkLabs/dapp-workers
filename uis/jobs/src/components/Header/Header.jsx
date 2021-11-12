import React from 'react';
import classes from './Header.module.scss';

import Logo from '../../assets/logo/logo.png';

const header = (props) => {
  return (
    <div className={classes.container}>
        <div><img className={classes.logo} src={Logo} alt="LiquidApps Logo"/></div>
    </div>
  );
};

export default header;
