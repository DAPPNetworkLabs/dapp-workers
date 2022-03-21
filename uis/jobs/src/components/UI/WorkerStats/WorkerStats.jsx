import React from 'react';
import classes from './WorkerStats.module.scss';

import { loc } from '@loc';

const WorkerStats = (props) => {
    let className = props.isMobile ?  [classes.overflow,classes.topSpace] : [classes.topSpace]
    className.push(classes.flex);
    return (
        <div className={className.join(' ')}>
            <span>DAPP WORKERS: {props.workers}</span>
            <span>GAS PAID: {props.gasPaid/1e4} DAPP</span>
        </div>
    );
};

export default WorkerStats;