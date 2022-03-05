import React from 'react';
import { NavLink } from 'react-router-dom';
import classes from './Button.module.scss';

const Button = (props) => {
    let className = [classes.button];
    if(props.wide) className.push(classes.wide);
    props.isDayNight ? className.push(classes.day) : className.push(classes.night);
    if(props.wide) className.push(classes.wide);
    let btn, dropDownItems, menuItems;
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
                dropDownItems =   
                <div className={classes.dropdown}>
                    <div 
                        className={className.join(" ")} 
                        onClick={props.onClick}
                        >{
                        props.text}
                    </div>
                    <div className={[classes.content,classes.menu].join(" ")}>
                        {items}
                    </div>
                </div>;
        } else if(props.menuItems) {
            console.log(props.menuItems);
            dropDownItems = props.menuItems.map((el, i) => {
                console.log(el);
                return (
                    <div className={[classes.dropdown,classes.flex].join(' ')}>
                        <div className={className.join(" ")} >{el.text}</div>
                        <div className={[classes.content,classes.menu].join(" ")}>
                            {el.dropdown.map(elem => <NavLink to={elem.path}>{elem.name}</NavLink>)}
                        </div>
                    </div>
                )
            });
        }
    } else {
        btn = <div 
            className={className.join(" ")} 
            onClick={props.onClick}
            >{props.text}</div>
    }
    return (
        <>
            {btn}
            {dropDownItems}
        </>
    );
};

export default Button;

//rsc