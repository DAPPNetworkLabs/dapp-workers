import React from 'react';
import classes from './RunJob.module.scss';

const RunJob = (props) => {
    return (
        <div>
            <input type="text" onChange={props.onChange} name="consumer" placeholder="address consumer"></input>
            <input type="text" onChange={props.onChange} name="imageName" placeholder="string imageName"></input>
            <input type="text" onChange={props.onChange} name="inputFS" placeholder="string inputFS"></input>
            <input type="text" onChange={props.onChange} name="args" placeholder="string[] args"></input>
            <button onClick={props.runJob}>Run Job</button>
        </div>
    );
};

export default RunJob;