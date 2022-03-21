import React from 'react';
import classes from './Jobs.module.scss';

import { loc } from '@loc';

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
                    <th class={classes.tooltip}>ID<span class={classes.tooltiptextForm}>{loc(`forms.id`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>OWNER<span class={classes.tooltiptextForm}>{loc(`forms.owner`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>CONSUMER<span class={classes.tooltiptextForm}>{loc(`forms.consumer`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>IMAGE<span class={classes.tooltiptextForm}>{loc(`forms.image`,props.lang)}</span></th>
                    <th class={classes.tooltip}>CALLBACK<span class={classes.tooltiptextForm}>{loc(`forms.callback`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>CONSISTENT<span class={classes.tooltiptextForm}>{loc(`forms.consistent`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>GAS LIMIT<span class={classes.tooltiptextForm}>{loc(`forms.gasLimit`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>RESULTS<span class={classes.tooltiptextForm}>{loc(`forms.results`,props.lang)}</span></th> 
                </tr>
                {jobs}
            </table>
        </div>
    );
};

export default Jobs;