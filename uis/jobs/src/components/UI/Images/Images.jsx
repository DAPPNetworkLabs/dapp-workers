import React from 'react';
import classes from './Images.module.scss';

import { loc } from '@loc';

const Images = (props) => {
    let images;
    if(props.jobImages || props.serviceImages) {
        images = props.isJob ? props.jobImages.map((el,i)=>{
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.worker}`)}}>{`${el.worker.slice(0,4)}..${el.worker.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.image}`)}}>{el.image}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.jobFee/1e6}`)}}>{el.jobFee/1e6}</td>
                </tr>
            )
        }) : props.serviceImages.map((el,i)=>{
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.worker}`)}}>{`${el.worker.slice(0,4)}..${el.worker.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.image}`)}}>{el.image}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.baseFee/1e6}`)}}>{el.baseFee/1e6}</td>
                </tr>
            )
        })
    }
    const jobService = props.isJob ? (
        <tr>
            <th class={classes.tooltip}>WORKER<span class={classes.tooltiptextForm}>{loc(`forms.worker`,props.lang)}</span></th> 
            <th class={classes.tooltip}>IMAGE<span class={classes.tooltiptextForm}>{loc(`forms.image`,props.lang)}</span></th> 
            <th class={classes.tooltip}>JOB FEE<span class={classes.tooltiptextForm}>{loc(`forms.jobFee`,props.lang)}</span></th> 
        </tr>
    ) : (
        <tr>
            <th class={classes.tooltip}>WORKER<span class={classes.tooltiptextForm}>{loc(`forms.worker`,props.lang)}</span></th> 
            <th class={classes.tooltip}>IMAGE<span class={classes.tooltiptextForm}>{loc(`forms.image`,props.lang)}</span></th> 
            <th class={classes.tooltip}>SERVICE FEE<span class={classes.tooltiptextForm}>{loc(`forms.baseFee`,props.lang)}</span></th> 
        </tr>
    )
    return (
        <div className={props.isMobile ? classes.overflow : ''}>
            <table>
                {jobService}
                {images}
            </table>
        </div>
    );
};

export default Images;