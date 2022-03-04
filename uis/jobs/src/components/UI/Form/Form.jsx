import React from 'react';
import classes from './Form.module.scss';

import Button from '../Button/Button'

const Form = (props) => {
    const inputs = props.inputs.map((el,i) => {
        return (
        <input 
            className={classes.formInput}
            type="text"
            onChange={(event) => props.onChange(event,props.event)}
            name={el.name}
            placeholder={el.placeholder}
        ></input>)
    });
    const button = <Button 
        wide={props.wide} 
        text={props.buttonText} 
        isDayNight={props.isDayNight}
        onClick={props.onClick}
    >{props.buttonText}
    </Button>;
    return (
        <div className={classes.form}>
            {inputs}
            {button}
        </div>
    );
};

export default Form;