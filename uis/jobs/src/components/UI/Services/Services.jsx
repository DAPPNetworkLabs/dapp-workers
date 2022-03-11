import React from 'react';
import classes from './Services.module.scss';

const Services = (props) => {
    let services;
    if(props.services) {
        console.log(props.services);
        services = props.services.map((el,i)=>{
            return (
                <div>
                    {el.owner}
                    {el.consumer}
                    {el.imageName}
                    {el.months}
                    {el.requireConsistent}
                    {el.ioMegaBytes}
                    {el.started}
                    {el.endDate}
                </div>
            )
        })
    }
    return (
        <div>
            <div>services:</div>
            <div>{services}</div>
        </div>
    );
};

export default Services;