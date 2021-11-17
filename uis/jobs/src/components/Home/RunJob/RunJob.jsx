import React from 'react';
import classes from './RunJob.module.scss';

const RunJob = (props) => {
    return (
        <div>
            <input type="text" onChange={(event) => props.onChange(event,"runJob")} name="jobID" placeholder="uint256 jobID"></input>
            <input type="text" onChange={(event) => props.onChange(event,"runJob")} name="outputFS" placeholder="string outputFS"></input>
            <input type="text" onChange={(event) => props.onChange(event,"runJob")} name="dapps" placeholder="uint256 dapps"></input>
            <button onClick={props.runJob}>Run Job</button>
        </div>
    );
};

export default RunJob;