import React from 'react';
import classes from './Jobs.module.scss';

const Jobs = (props) => {
    let jobs;
    if(props.jobs) {
        console.log(props.jobs);
        jobs = props.jobs.map((el,i)=>{
            return (
                <div>
                    {el.owner}
                    {el.consumer}
                    {el.imageName}
                    {el.callback}
                    {el.requireConsistent}
                    {el.gasLimit}
                    {el.resultsCount}
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