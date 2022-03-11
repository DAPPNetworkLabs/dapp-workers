import React from 'react';
import classes from './Services.module.scss';
let test = [
    {
        "dsp": "0xE26f809e5826fd8E1c0dA1E6d9f308da9D86De4f",
        "endpoint": "asdf:0"
    },
    {
        "dsp": "0xE26f809e5826fd8E1c0dA1E6d9f308da9D86De4f",
        "endpoint": "asdf:0"
    },
    {
        "dsp": "0xE26f809e5826fd8E1c0dA1E6d9f308da9D86De4f",
        "endpoint": "asdf:0"
    }
        ]
const Services = (props) => {
    let services;
    if(props.services) {
        services = props.services.map((el,i) => {
            const dsps = test.map((dsp,index) => {
                return (
                    <div>{`${dsp.dsp.slice(0,4)}..${dsp.dsp.slice(-4)} | ${dsp.endpoint}`}</div>
                );
            });
            return (
                <tr>
                    <td>{`${el.owner.slice(0,4)}..${el.owner.slice(-4)}`}</td>
                    <td>{`${el.consumer.slice(0,4)}..${el.consumer.slice(-4)}`}</td>
                    <td>{el.imageName}</td>
                    <td>{el.months}</td>
                    <td>{el.started.toString()}</td>
                    <td>{el.ioMegaBytes}</td>
                    <td>{el.storageMegaBytes}</td>
                    <td>{new Date(Number(el.endDate)*1000).toLocaleDateString()}</td>
                    <td>{dsps}</td>
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
                    <th>STORAGE LIMIT</th>
                    <th>END DATE</th>
                    <th>DSP | ENDPOINT</th>
                </tr>
                {services}
            </table>
        </div>
    );
};

export default Services;