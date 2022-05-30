import React from 'react';
import classes from './SubTitle.module.scss';

const SubTitle = (props) => {
    const className = [];
    props.isDayNight ? className.push(classes.dayTitle) : className.push(classes.nightTitle);
    if(props.theme === "red") className.push(classes.red);
    let el = <div 
        className={className.join(" ")} 
        onClick={props.onClick}
        >{props.text}</div>
    return (
        <>
            {el}
        </>
    );
};

export default SubTitle;

//rsc