import React from 'react';
import classes from './Services.module.scss';

import { loc } from '@loc';

const Services = (props) => {
    let services;
    console.log(props.services)
    if(props.services) {
        services = props.services.map((el,i) => {
            if(el.endpoints) el.endpoints[1] = el.endpoints[0]
            const workers = el.endpoints.map((worker,index) => {
                if(worker && !props.isWorker) {
                    return (
                        <div>
                            <td onClick={() => {navigator.clipboard.writeText(`${worker.worker} | ${worker.endpoint} | ${worker.storageUsed}/${el.storageMegaBytes}`)}}>{`${worker.worker.slice(0,4)}..${worker.worker.slice(-4)} | ${worker.endpoint} | ${worker.storageUsed}/${el.storageMegaBytes}`}</td>
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
                    {workers}
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
                    {!props.isWorker ? <th class={classes.tooltip}>WORKER | ENDPOINT<span class={classes.tooltiptextForm}>{loc(`forms.workerEndpointIoStorage`,props.lang)}</span></th> : ''}
                </tr>
                {services}
            </table>
        </div>
    );
};

export default Services;