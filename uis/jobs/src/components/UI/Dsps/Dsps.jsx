import React from 'react';
import classes from './Dsps.module.scss';

const Dsps = (props) => {
    let dsps;
    if(props.dsps) {
        console.log(props.dsps);
        dsps = props.dsps.map((el,i)=>{
            return (
                <tr>
                    <td>{`${el.dsp.slice(0,4)}..${el.dsp.slice(-4)}`}</td>
                    <td>{el.endpoint}</td>
                    <td>{el.jobsCompleted}</td>
                    <td>{el.jobErrors}</td>
                    <td>{el.servicesCompleted}</td>
                    <td>{el.serviceErrors}</td>
                    <td>{Number(el.dappGas)/1e4}</td>
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