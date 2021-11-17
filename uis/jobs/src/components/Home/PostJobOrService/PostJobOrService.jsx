import React from 'react';
import classes from './PostJobOrService.module.scss';

const PostJobOrService = (props) => {
    return (
        <div>
            <input type="text" onChange={(event) => props.onChange(event,"run")} name="consumer" placeholder="address consumer"></input>
            <input type="text" onChange={(event) => props.onChange(event,"run")} name="imageName" placeholder="string imageName"></input>
            <input type="text" onChange={(event) => props.onChange(event,"run")} name="inputFS" placeholder="string inputFS"></input>
            <input type="text" onChange={(event) => props.onChange(event,"run")} name="args" placeholder="string[] args"></input>
            <button onClick={props.postJobOrService}>Post Job or Service</button>
        </div>
    );
};

export default PostJobOrService;