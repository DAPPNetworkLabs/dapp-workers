import React from 'react';
import classes from './Jobs.module.scss';

const Jobs = (props) => {
    let jobs;
    if(props.jobs) {
        console.log(props.jobs);
        jobs = props.jobs.map((el,i)=>{
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.id}`)}}>{`${el.id}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.owner}`)}}>{`${el.owner.slice(0,4)}..${el.owner.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.consumer}`)}}>{`${el.consumer.slice(0,4)}..${el.consumer.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.imageName}`)}}>{el.imageName}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.callback.toString()}`)}}>{el.callback.toString()}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.requireConsistent.toString()}`)}}>{el.requireConsistent.toString()}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.gasLimit}`)}}>{el.gasLimit}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.resultsCount}`)}}>{el.resultsCount}</td>
                </tr>
            )
        })
    }
    return (
        <div className={props.isMobile ? classes.overflow : classes.desktopOverflow}>
            <table>
                <tr>
                    <th>ID</th> 
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