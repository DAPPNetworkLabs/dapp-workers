import React from 'react';
import classes from './Button.module.scss';

const Button = (props) => {
    let className = props.wide ? classes.wideButton : classes.button;
    let el = <div className={className} onClick={props.onClick}>{props.text}</div>
    return (
        <>
            {el}
        </>
    );
};

export default Button;

//rsc