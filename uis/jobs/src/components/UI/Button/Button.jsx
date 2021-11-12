import React from 'react';
import classes from './Button.module.scss';

const Button = (props) => {
    return (
        <div>
            <button onClick={props.login}>Login</button>
        </div>
    );
};

export default Button;

//rsc