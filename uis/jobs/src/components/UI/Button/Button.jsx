import React from 'react';
import classes from './Button.module.scss';

const Button = (props) => {
    let className = [classes.button];
    if(props.wide) className.push(classes.wide);
    props.isDayNight ? className.push(classes.day) : className.push(classes.night);
    if(props.wide) className.push(classes.wide);
    console.log('className.join(" ")',className.join(" "));
    let el, dropDownItems;
    if(props.dropDownItems) {
        console.log('hit')
        // dropDownItems =   <div className={props.isDayNight ? classes.day : classes.night}>
        dropDownItems =   
        <div className={classes.dropdown}>
            <div 
                className={className.join(" ")} 
                onClick={props.onClick}
                >{props.text}
            </div>
            <div className={classes.content}>
                <a href="#">Link 1</a>
                <a href="#">Link 2</a>
                <a href="#">Link 3</a>
            </div>
        </div>;
    } else {
        el = <div 
            className={className.join(" ")} 
            onClick={props.onClick}
            >{props.text}</div>
    }
    return (
        <>
            {el}
            {dropDownItems}
        </>
    );
};

export default Button;

//rsc