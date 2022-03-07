import React from 'react';
import classes from './MobileMenuToggleButton.module.scss';

export const MobileMenuToggleButton = props => {
  let hamburgerLine;
  if (props.isDayNight)
    hamburgerLine = classes.toggleButtonLineDark;
  else
    hamburgerLine = classes.toggleButtonLine;
  return (
    <button className={classes.toggleButton} onClick={props.onToggleButtonClick}>
      <div className={hamburgerLine}></div>
      <div className={hamburgerLine}></div>
      <div className={hamburgerLine}></div>
    </button>
  );
};
