import React from 'react';
import classes from './Services.module.scss';

const Services = (props) => {
    let services;
    if(props.services) {
        services = props.services.map((el,i) => {
            const dsps = el.endpoints.map((dsp,index) => {
                return (
                    <>
                        <td onClick={() => {navigator.clipboard.writeText(`${dsp.dsp}`)}}>{`${dsp.dsp.slice(0,4)}..${dsp.dsp.slice(-4)}`}</td>
                        <td onClick={() => {navigator.clipboard.writeText(`${dsp.endpoint}`)}}>{`${dsp.endpoint}`}</td>
                        <td onClick={() => {navigator.clipboard.writeText(`${dsp.ioUsed}/${el.ioMegaBytes}`)}}>{`${dsp.ioUsed}/${el.ioMegaBytes}`}</td>
                        <td onClick={() => {navigator.clipboard.writeText(`${dsp.storageUsed}/${el.storageMegaBytes}`)}}>{`${dsp.storageUsed}/${el.storageMegaBytes}`}</td>
                    </>
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
                    <th>DSP</th>
                    <th>ENDPOINT</th>
                    <th>IO</th>
                    <th>STORAGE</th>
                </tr>
                {services}
            </table>
        </div>
    );
};

export default Services;