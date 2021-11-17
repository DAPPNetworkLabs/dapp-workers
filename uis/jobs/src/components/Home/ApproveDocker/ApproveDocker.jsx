import React from 'react';
import classes from './ApproveDocker.module.scss';

const ApproveDocker = (props) => {
    return (
        <div>
            <input type="text" onChange={(event) => props.onChange(event,"approveDocker")} name="imageName" placeholder="string imageName"></input>
            <button onClick={props.approveDocker}>Approve Docker Image</button>
        </div>
    );
};

export default ApproveDocker;