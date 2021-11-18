import React from 'react';
import classes from './Form.module.scss';

const Form = (props) => {
    const inputs = props.inputs.map((el,i) => {
        return (
        <input 
            type="text"
            onChange={(event) => props.onChange(event,props.event)}
            name={el.name}
            placeholder={el.placeholder}
        ></input>)
    });
    const button = <button onClick={props.onClick}>{props.buttonText}</button>;
    return (
        <div>
            {inputs}
            {button}
        </div>
    );
};

export default Form;