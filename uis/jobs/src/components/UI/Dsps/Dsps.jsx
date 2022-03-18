import React from 'react';
import classes from './Dsps.module.scss';

const Dsps = (props) => {
    let dsps;
    if(props.dsps) {
        console.log(props.dsps);
        dsps = props.dsps.map((el,i)=>{
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.dsp}`)}}>{`${el.dsp.slice(0,4)}..${el.dsp.slice(-4)}`}</td>
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
                    <th>DSP</th> 
                    <th>ENDPOINT</th>
                    <th>JOBS</th>
                    <th>JOB ERRORS</th>
                    <th>SERVICES</th>
                    <th>SERVICE ERRORS</th>
                    <th>DAPP GAS</th>
                </tr>
                {dsps}
            </table>
        </div>
    );
};

export default Dsps;