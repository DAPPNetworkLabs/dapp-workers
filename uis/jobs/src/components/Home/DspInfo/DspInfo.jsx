import React from 'react';
import classes from './DspInfo.module.scss';

const DspInfo = (props) => {
    return (
        <div>
            <input type="text" onChange={(event) => props.onChange(event,"registeredDSPs")} name="dsp" placeholder="address dsp"></input>
            <button onClick={props.fetchDspInfo}>Fetch DSP Info</button>
        </div>
    );
};

export default DspInfo;