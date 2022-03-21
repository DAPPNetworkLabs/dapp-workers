import React from 'react';
import classes from './Images.module.scss';

const Images = (props) => {
    let images;
    if(props.jobImages || props.serviceImages) {
        images = props.isJob ? props.jobImages.map((el,i)=>{
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.dsp}`)}}>{`${el.dsp.slice(0,4)}..${el.dsp.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.image}`)}}>{el.image}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.jobFee}`)}}>{el.jobFee}</td>
                </tr>
            )
        }) : props.serviceImages.map((el,i)=>{
            return (
                <tr>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.dsp}`)}}>{`${el.dsp.slice(0,4)}..${el.dsp.slice(-4)}`}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.image}`)}}>{el.image}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.baseFee}`)}}>{el.baseFee}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.storageFee}`)}}>{el.storageFee}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.ioFee}`)}}>{el.ioFee}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.minIoMegaBytes}`)}}>{el.minIoMegaBytes}</td>
                    <td onClick={() => {navigator.clipboard.writeText(`${el.minStorageMegaBytes}`)}}>{el.minStorageMegaBytes}</td>
                </tr>
            )
        })
    }
    const jobService = props.isJob ? (
        <tr>
            <th>DSP</th> 
            <th>IMAGE</th> 
            <th>JOB FEE</th>
        </tr>
    ) : (
        <tr>
            <th>DSP</th> 
            <th>IMAGE</th> 
            <th>BASE FEE</th>
            <th>STORAGE FEE</th>
            <th>IO FEE</th>
            <th>MIN STORAGE MB</th>
            <th>MIN IO MB</th>
        </tr>
    )
    return (
        <div className={props.isMobile ? classes.overflow : ''}>
            <table>
                {jobService}
                {images}
            </table>
        </div>
    );
};

export default Images;