import React from 'react';
import classes from './SetDockerImage.module.scss';

const SetDockerImage = (props) => {
    return (
        <div>
        <input type="text" onChange={(event) => props.onChange(event,"setDockerImage")} name="setDockerImageName" placeholder="string imageName"></input>
        <input type="text" onChange={(event) => props.onChange(event,"setDockerImage")} name="imageAddress" placeholder="string imageAddress"></input>
        <input type="text" onChange={(event) => props.onChange(event,"setDockerImage")} name="imageHash" placeholder="string imageHash"></input>
        <input type="text" onChange={(event) => props.onChange(event,"setDockerImage")} name="imageType" placeholder="string imageType"></input>
            <button onClick={props.setDockerImage}>Set Docker Image</button>
        </div>
    );
};

export default SetDockerImage;