import React from 'react';
import classes from './Workers.module.scss';

import { loc } from '@loc';

const Workers = (props) => {
    let workers;
    if(props.workers) {
        workers = props.workers.map((el,i)=>{
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.worker}`)}}>{`${el.worker.slice(0,4)}..${el.worker.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.endpoint}`)}}>{el.endpoint}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.jobsCompleted}`)}}>{el.jobsCompleted}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.jobErrors}`)}}>{el.jobErrors}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.servicesCompleted}`)}}>{el.servicesCompleted}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.serviceErrors}`)}}>{el.serviceErrors}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${Number(el.dappGas)/1e4}`)}}>{Number(el.dappGas)/1e4}</td>
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
                    <th class={classes.tooltip}>JOBS<span class={classes.tooltiptextForm}>{loc(`forms.jobs`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>JOB ERRORS<span class={classes.tooltiptextForm}>{loc(`forms.jobErrors`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>SERVICES<span class={classes.tooltiptextForm}>{loc(`forms.services`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>SERVICE ERRORS<span class={classes.tooltiptextForm}>{loc(`forms.serviceErrors`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>DAPP GAS<span class={classes.tooltiptextForm}>{loc(`forms.dappGas`,props.lang)}</span></th> 
                </tr>
                {workers}
            </table>
        </div>
    );
};

export default Workers;