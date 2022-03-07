import React from 'react';
import classes from './Footer.module.scss';

import isMobile from '@helpers'

const links = [
  {"text":"Github","link":"https://github.com/DAPPNetworkLabs/dapp-workers"},
  {"text":"Discord","link":"https://discord.com/channels/924090210030067744/925867071923949650/930778349826088960"}
]

const footer = (props) => {
  const footerLinks = links.map((el, i) => {
    return (
      <a className={props.isDayNight ? classes.day : classes.night} target="_blank" rel="noreferrer" href={el.link}>{el.text}</a>
    )
  });
  return (
    <div className={classes.flex}>
      {footerLinks}
    </div>
  );
};

export default footer;
