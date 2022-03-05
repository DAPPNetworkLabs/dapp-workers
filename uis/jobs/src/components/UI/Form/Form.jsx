import React from 'react';
import classes from './Form.module.scss';

import Button from '../Button/Button'

const Form = (props) => {
    const inputs = props.inputs.map((el,i) => {
        return (
        <input 
            className={classes.formInput}
            type={props.previews[i].type == "int" ? "number":'text'}
            onChange={(event) => props.onChange(event,props.event)}
            name={el.name}
            placeholder={el.placeholder}
        ></input>)
    });
    const previewItems = props.inputs.map((el,i) => {
        let text, value;
        if(props.previews[i].type == "address"){
            text = props.previews[i].name
            value = props.previewValues[i].key ? `${props.previewValues[i].key.slice(0,4)}..${props.previewValues[i].key.slice(-4)}` : '0x'
        } else if(props.previews[i].type == "int") {
            text = props.previews[i].name
            value = (Number(props.previewValues[i].key) / 1e4).toFixed(4);
        } else {
            text = props.previews[i];
            value = props.previewValues[i].key;
        }
        return (
        <div 
            className={classes.preview}
            type="text"
            onChange={(event) => props.onChange(event,props.event)}
            name={el.name}
            placeholder={el.placeholder}
        >
            <div className={classes.keyValue}>
                {text}
            </div>
            <div className={classes.keyValue}>
                {value}
            </div>
        </div>)
    });
    const button = <Button 
        wide={true}
        text={props.buttonText} 
        isDayNight={props.isDayNight}
        onClick={props.onClick}
    >{props.buttonText}
    </Button>;
    return (
        <div>
            <div className={classes.form}>
                <div className={classes.innerForm}>
                    FORM
                    {inputs}
                </div>
                <div className={classes.innerForm}>
                    PREVIEW
                    {previewItems}
                </div>
            </div>
            {button}
        </div>
    );
};

export default Form;