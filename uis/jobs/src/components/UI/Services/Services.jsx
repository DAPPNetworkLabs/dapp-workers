import React from 'react';
import classes from './Services.module.scss';

import { loc } from '@loc';

const Services = (props) => {
    let services;
    console.log(props.services)
    if(props.services) {
        services = props.services.map((el,i) => {
            if(el.endpoints) el.endpoints[1] = el.endpoints[0]
            const dsps = el.endpoints.map((dsp,index) => {
                if(dsp && !props.isDsp) {
                    return (
                        <div>
                            <td onClick={() => {navigator.clipboard.writeText(`${dsp.dsp} | ${dsp.endpoint} | ${dsp.ioUsed}/${el.ioMegaBytes} | ${dsp.storageUsed}/${el.storageMegaBytes}`)}}>{`${dsp.dsp.slice(0,4)}..${dsp.dsp.slice(-4)} | ${dsp.endpoint} | ${dsp.ioUsed}/${el.ioMegaBytes} | ${dsp.storageUsed}/${el.storageMegaBytes}`}</td>
                        </div>
                    );
                }
            });
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.id}`)}}>{`${el.id}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.owner}`)}}>{`${el.owner.slice(0,4)}..${el.owner.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.consumer}`)}}>{`${el.consumer.slice(0,4)}..${el.consumer.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.imageName}`)}}>{el.imageName}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.months}`)}}>{el.months}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.started.toString()}`)}}>{el.started.toString()}</td>
                    <td onClick={() => {navigator.clipboard.writeText(new Date(Number(el.endDate)*1000).toLocaleDateString())}}>{new Date(Number(el.endDate)*1000).toLocaleDateString()}</td>
                    {dsps}
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
                    <th class={classes.tooltip}>MONTHS<span class={classes.tooltiptextForm}>{loc(`forms.months`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>STARTED<span class={classes.tooltiptextForm}>{loc(`forms.started`,props.lang)}</span></th> 
                    <th class={classes.tooltip}>END DATE<span class={classes.tooltiptextForm}>{loc(`forms.endDate`,props.lang)}</span></th> 
                    {!props.isDsp ? <th class={classes.tooltip}>DSP | ENDPOINT | IO | STORAGE<span class={classes.tooltiptextForm}>{loc(`forms.dspEndpointIoStorage`,props.lang)}</span></th> : ''}
                </tr>
                {services}
            </table>
        </div>
    );
};

export default Services;