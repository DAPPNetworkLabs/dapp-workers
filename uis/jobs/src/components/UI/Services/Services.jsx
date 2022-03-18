import React from 'react';
import classes from './Services.module.scss';

const Services = (props) => {
    let services;
    console.log(props.services)
    if(props.services) {
        services = props.services.map((el,i) => {
            if(el.endpoints) el.endpoints[1] = el.endpoints[0]
            const dsps = el.endpoints.map((dsp,index) => {
                return (
                    <div>
                        <td onClick={() => {navigator.clipboard.writeText(`${dsp.dsp} | ${dsp.endpoint} | ${dsp.ioUsed}/${el.ioMegaBytes} | ${dsp.storageUsed}/${el.storageMegaBytes}`)}}>{`${dsp.dsp.slice(0,4)}..${dsp.dsp.slice(-4)} | ${dsp.endpoint} | ${dsp.ioUsed}/${el.ioMegaBytes} | ${dsp.storageUsed}/${el.storageMegaBytes}`}</td>
                    </div>
                );
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
                    <th>ID</th> 
                    <th>OWNER</th> 
                    <th>CONSUMER</th>
                    <th>IMAGE</th>
                    <th>MONTHS</th>
                    <th>STARTED</th>
                    <th>END DATE</th>
                    <th>DSP | ENDPOINT | IO | STORAGE</th>
                    {/* <th>ENDPOINT</th>
                    <th>IO</th>
                    <th>STORAGE</th> */}
                </tr>
                {services}
            </table>
        </div>
    );
};

export default Services;