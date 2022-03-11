import React from 'react';
import classes from './Services.module.scss';

const Services = (props) => {
    let services;
    if(props.services) {
        console.log(props.services);
        services = props.services.map((el,i)=>{
            return (
                <tr>
                    <td>{`${el.owner.slice(0,4)}..${el.owner.slice(-4)}`}</td>
                    <td>{`${el.consumer.slice(0,4)}..${el.consumer.slice(-4)}`}</td>
                    <td>{el.imageName}</td>
                    <td>{el.months}</td>
                    <td>{el.started.toString()}</td>
                    <td>{el.ioMegaBytes}</td>
                    <td>{el.storageMegaBytes}</td>
                    <td>{el.endDate}</td>
                </tr>
            )
        })
    }
    return (
        <div className={props.isMobile ? classes.overflow : ''}>
            <table>
                <tr>
                    <th>OWNER</th> 
                    <th>CONSUMER</th>
                    <th>IMAGE</th>
                    <th>MONTHS</th>
                    <th>STARTED</th>
                    <th>I/O LIMIT</th>
                    <th>STORAG LIMIT</th>
                    <th>END DATE</th>
                </tr>
                {services}
            </table>
        </div>
    );
};

export default Services;