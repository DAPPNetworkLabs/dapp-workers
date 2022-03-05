import React from 'react';
import { NavLink } from 'react-router-dom';
import classes from './Button.module.scss';

const Button = (props) => {
    let className = [classes.button];
    if(props.wide) className.push(classes.wide);
    props.isDayNight ? className.push(classes.day) : className.push(classes.night);
    if(props.wide) className.push(classes.wide);
    let el, dropDownItems;
    console.log(props)
    if(props.dropDownItems || props.menuItems) {
        let items;
        if(props.dropDownItems){
            console.log(props.dropDownItems)
            items = props.dropDownItems.map((el, i) => {
                    return (
                        <div onClick={el.onClick}>{el.text}</div>
                    )
                })
        } else if(props.menuItems) {
            console.log(props.menuItems)
            items = props.menuItems.map((el, i) => {
                    return (
                        el.dropdown.map(elem => <NavLink to={elem.path}><div>{elem.name}</div></NavLink>)
                    )
                })
        }
        // dropDownItems =   <div className={props.isDayNight ? classes.day : classes.night}>
        dropDownItems =   
        <div className={classes.dropdown}>
            <div 
                className={className.join(" ")} 
                onClick={props.onClick}
                >{props.text}
            </div>
            <div className={classes.content}>
                {items}
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