import React from 'react';
import classes from './SubTitle.module.scss';

const SubTitle = (props) => {
    let className;
    props.isDayNight ? className = classes.dayTitle : className = classes.nightTitle;
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

export default SubTitle;

//rsc