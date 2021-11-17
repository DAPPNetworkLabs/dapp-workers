import React from 'react';
import classes from './Services.module.scss';

const Services = (props) => {
    return (
        <div>
            <div>Services:</div>
            <div>{props.services}</div>
        </div>
    );
};

export default Services;