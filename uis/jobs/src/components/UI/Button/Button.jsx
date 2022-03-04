import React from 'react';
import classes from './Button.module.scss';

const Button = (props) => {
    let className;
    console.log();
    if(props.wide && props.isDayNight) {
        console.log(1);
        className = classes.wideButtonDay;
    } else if(props.isDayNight) {
        console.log(2);
        className = classes.buttonDay;
    } else if(props.wide) {
        console.log(3);
        className = classes.wideButton;
    } else {
        console.log(4);
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