import React from 'react';
import classes from './Jobs.module.scss';

const Jobs = (props) => {
    let jobs;
    if(props.jobs) {
        jobs = props.jobs.map((el,i)=>{
            return (
                <div>
                    {el.job}
                </div>
            )
        })
    }
    return (
        <div>
            <div>Jobs:</div>
            <div>{jobs}</div>
        </div>
    );
};

export default Jobs;