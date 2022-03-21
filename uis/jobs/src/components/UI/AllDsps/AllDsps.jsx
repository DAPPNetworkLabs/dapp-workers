import React from 'react';
import classes from './AllDsps.module.scss';

import { loc } from '@loc';

const AllDsps = (props) => {
    let dsps;
    console.log(props.allDspInfo)
    if(props.allDspInfo) {
        dsps = props.allDspInfo.map((el,i)=>{
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.dsp}`)}}>{`${el.dsp.slice(0,4)}..${el.dsp.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.endpoint}`)}}>{el.endpoint}</td>
                </tr>
            )
        })
    }
    return (
        <div className={props.isMobile ? classes.overflow : ''}>
            <table>
                <tr>
                    <th class={classes.tooltip}>DSP<span class={classes.tooltiptextForm}>{loc(`forms.dsp`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>ENDPOINT<span class={classes.tooltiptextForm}>{loc(`forms.endpoint`,props.lang)}</span></th> 
                </tr>
                {dsps}
            </table>
        </div>
    );
};

export default AllDsps;