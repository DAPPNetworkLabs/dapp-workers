import React from 'react';
import classes from './Title.module.scss';

const Title = (props) => {
    let className;
    props.isDayNight ? className = classes.dayTitle : className = classes.nightTitle;
    let el = <div 
        className={className} 
        onClick={props.onClick}
        >
            {props.text}
            </div>
    return (
        <>
            {el}
        </>
    );
};

export default Title;

//rsc