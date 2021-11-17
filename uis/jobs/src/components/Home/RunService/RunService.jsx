import React from 'react';
import classes from './RunService.module.scss';

const RunService = (props) => {
    return (
        <div>
        <input type="text" onChange={(event) => props.onChange(event,"runService")} name="jobId" placeholder="uint256 jobId"></input>
        <input type="text" onChange={(event) => props.onChange(event,"runService")} name="port" placeholder="uint256 port"></input>
        <input type="text" onChange={(event) => props.onChange(event,"runService")} name="dapps" placeholder="uint256 dapps"></input>
            <button onClick={props.runService}>Run Service</button>
        </div>
    );
};

export default RunService;