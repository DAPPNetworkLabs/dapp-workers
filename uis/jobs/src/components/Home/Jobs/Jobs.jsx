import React from 'react';
import classes from './Jobs.module.scss';

const Jobs = (props) => {
    return (
        <div>
            <div>Jobs:</div>
            <div>{props.jobs}</div>
        </div>
    );
};

export default Jobs;