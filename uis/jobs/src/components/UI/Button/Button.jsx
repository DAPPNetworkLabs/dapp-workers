import React from 'react';
import classes from './Button.module.scss';

const Button = (props) => {
    let el;
    if(props.account){
        el = <div onClick={props.logout}>{props.account}</div>
    } else {
        el = (<button onClick={props.login}>Login</button>)
    }
    return (
        <div>
            {el}
        </div>
    );
};

export default Button;

//rsc