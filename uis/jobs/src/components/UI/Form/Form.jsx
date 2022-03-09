import React from 'react';
import classes from './Form.module.scss';

import Button from '../Button/Button'

const Form = (props) => {
    const inputs = props.inputs.map((el,i) => {
        let type = "text";
        if(props.previews[i].type == "uint" || props.previews[i].type == "dapp") {
            type = "number"
        } else if(props.previews[i].type == "bool") {
            type = "checkbox"
        }
        return (
            <input 
                className={classes.formInput}
                type={type}
                onChange={(event) => props.onChange(event,props.stateSelector,props.previews[i].type)}
                name={el.name}
                placeholder={el.placeholder}
            ></input>
        )
    });
    const previewItems = props.inputs.map((el,i) => {
        let text, value;
        text = props.previews[i].name
        if(props.previews[i].type == "address"){
            value = props.previewValues[i].key ? `${props.previewValues[i].key.slice(0,4)}..${props.previewValues[i].key.slice(-4)}` : '0x'
        } else if(props.previews[i].type == "array_addresses"){
            if(props.previewValues[i].key.length){
                value = props.previewValues[i].key.map((el,index) => {
                    if(index == props.previewValues[i].key.length -1) {
                        return `${el.slice(0,4)}..${el.slice(-4)}`;
                    } else {
                        return `${el.slice(0,4)}..${el.slice(-4)},`;
                    }
                })
            } else {
                value = '0x';
            }
        } else if(props.previews[i].type == "dapp") {
            value = (Number(props.previewValues[i].key) / 1e4).toFixed(4);
        } else if(props.previews[i].type == "bool") {
            value = props.previewValues[i].key.toString();
        } else if(props.previews[i].type == "string") {
            if(props.previewValues[i].key && props.previewValues[i].key.length > 20) {
                value = `${props.previewValues[i].key.slice(0,4)}..${props.previewValues[i].key.slice(-4)}`
            } else {
                value = props.previewValues[i].key;
            }
        } else if(props.previews[i].type == "array") {
            value = props.previewValues[i].key.toString();
        } else if(props.previews[i].type == "uint") {
            value = (Number(props.previewValues[i].key));
        } else {
            value = props.previewValues[i].key;
        }
        return (
            <div 
                className={props.isMobile ? classes.previewMobile : classes.preview}
                type="text"
                onChange={(event) => props.onChange(event,props.event,props.previews[i].type)}
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
    if(!inputs.length && !previewItems.length) {
        return (
            <div className={classes.soloButton}>
                {button}
            </div>
        );
    }
    return (
        <div>
            <div className={props.isMobile ? classes.formMobile : classes.form}>
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