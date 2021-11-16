import React from 'react';
import classes from './Jobs.module.scss';

const Jobs = (props) => {
    return (
        <div>
            {props.jobs}
        </div>
    );
};

export default Jobs;