import React from 'react';
import classes from './Jobs.module.scss';

const Jobs = (props) => {
    let jobs;
    if(props.jobs) {
        console.log(props.jobs);
        jobs = props.jobs.map((el,i)=>{
            return (
                <tr>
                    <td>{`${el.owner.slice(0,4)}..${el.owner.slice(-4)}`}</td>
                    <td>{`${el.consumer.slice(0,4)}..${el.consumer.slice(-4)}`}</td>
                    <td>{el.imageName}</td>
                    <td>{el.callback.toString()}</td>
                    <td>{el.requireConsistent.toString()}</td>
                    <td>{el.gasLimit}</td>
                    <td>{el.resultsCount}</td>
                </tr>
            )
        })
    }
    return (
        <div className={props.isMobile ? classes.overflow : classes.desktopOverflow}>
            <table>
                <tr>
                    <th>OWNER</th> 
                    <th>CONSUMER</th>
                    <th>IMAGE</th>
                    <th>CALLBACK</th>
                    <th>CONSISTENT</th>
                    <th>GAS LIMIT</th>
                    <th>RESULTS</th>
                </tr>
                {jobs}
            </table>
        </div>
    );
};

export default Jobs;