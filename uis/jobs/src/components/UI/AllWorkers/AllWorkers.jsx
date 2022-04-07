import React from 'react';
import classes from './AllWorkers.module.scss';

import { loc } from '@loc';

const AllWorkers = (props) => {
    let workers;
    console.log(props.allWorkerInfo)
    if(props.allWorkerInfo) {
        workers = props.allWorkerInfo.map((el,i)=>{
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.worker}`)}}>{`${el.worker.slice(0,4)}..${el.worker.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.endpoint}`)}}>{el.endpoint}</td>
                </tr>
            )
        })
    }
    return (
        <div className={props.isMobile ? classes.overflow : ''}>
            <table>
                <tr>
                    <th class={classes.tooltip}>WORKER<span class={classes.tooltiptextForm}>{loc(`forms.worker`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>ENDPOINT<span class={classes.tooltiptextForm}>{loc(`forms.endpoint`,props.lang)}</span></th> 
                </tr>
                {workers}
            </table>
        </div>
    );
};

export default AllWorkers;