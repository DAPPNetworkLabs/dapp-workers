import React from 'react';
import classes from './Button.module.scss';

const Button = (props) => {
    let className;
    if(props.wide && props.isDayNight) {
        className = classes.wideButtonDay;
    } else if(props.isDayNight) {
        className = classes.buttonDay;
    } else if(props.wide) {
        className = classes.wideButton;
    } else {
        className = classes.button;
    }
    let el = <div 
        className={className} 
        onClick={props.onClick}
        >{props.text}</div>
    return (
        <>
            {el}
        </>
    );
};

export default Button;

//rsc