import React from 'react'
import Tabs from "components/Tabs";
import {useSelector} from "react-redux";
import {dspSelector} from "store/dsps";
import classNames from "classnames";
import './DSPPage.scss'
import _ from 'lodash'
import {useParams} from "react-router-dom";

const dspFunctions = [
    'regDSP',
    'deprecateDSP',

    'claim',

    'setJobDockerImage',
    'setServiceDockerImage',

    'approveDockerForDSP',
    'isImageApprovedForDSP',
    'unapproveDockerForDSP',
]

const JobImageTable = ({jobImages, approvedImages}) => {
    return (
        <table>
            <thead>
            <tr>
                <th>Image Name</th>
                <th>Status</th>
                <th>Image Address</th>
                <th>Image Hash</th>
                <th>Job Fee</th>
            </tr>
            </thead>
            <tbody>
            {_.map(jobImages, ({image: imageAddress, imageHash, jobFee}, imageName) => {
                const isApproved = approvedImages[imageName]

                return (
                    <tr key={`job-image-${imageName}`}>
                        <td>{imageName}</td>
                        <td>{isApproved ? 'Approved' : 'Unapproved'}</td>
                        <td>{imageAddress}</td>
                        <td>{imageHash}</td>
                        <td>{jobFee}</td>
                    </tr>
                )
            })}
            </tbody>
        </table>
    )
}

const ServiceImageTable = ({serviceImages, approvedImages}) => {
    return (
        <table>
            <thead>
            <tr>
                <th>Image Name</th>
                <th>Status</th>
                <th>Image Address</th>
                <th>Image Hash</th>
                <th>Base Fee</th>
                <th>Storage Fee</th>
                <th>IO Fee</th>
                {/*<th>Min Storage</th>*/}
                {/*<th>Min IO</th>*/}
            </tr>
            </thead>
            <tbody>
            {_.map(serviceImages, ({image: imageAddress, imageHash, baseFee, storageFee, ioFee, minStorageMegaBytes, minIoMegaBytes}, imageName) => {
                const isApproved = approvedImages[imageName]

                return (
                    <tr key={`service-image-${imageName}`}>
                        <td>{imageName}</td>
                        <td>{isApproved ? 'Approved' : 'Unapproved'}</td>
                        <td>{imageAddress}</td>
                        <td>{imageHash}</td>
                        <td>{baseFee}</td>
                        <td>{storageFee}</td>
                        <td>{ioFee}</td>
                        {/*<td>{minStorageMegaBytes} MB</td>*/}
                        {/*<td>{minIoMegaBytes} MB</td>*/}
                    </tr>
                )
            })}
            </tbody>
        </table>
    )
}

const DSPConsumersTable = ({dspConsumerData}) => {
    return (
        <table>
            <thead>
            <tr>
                <th>Address</th>
                <th>Usage</th>
                <th>Available Gas</th>
            </tr>
            </thead>
            <tbody>
            {_.map(dspConsumerData, ({amount}, address) => (
                <tr key={`dsp-consumer-${address}`}>
                    <td>{address}</td>
                    <td style={{minWidth: 200}}> </td>
                    <td>{amount}</td>
                </tr>
            ))}
            </tbody>
        </table>
    )
}

const DspPage = () => {

    let { dspaddr } = useParams()

    const dsp = useSelector(dspSelector(dspaddr))
    const {endpoint, dbEndpoint, active, registered, approvedImages, jobImages, serviceImages, claimableDapp, dspConsumerData} = dsp

    const account = useSelector(state => state.account)
    const isCurrentUser = account.address === dspaddr

    const tabs = [
        {
            title: 'Images', component: () => (
                <>
                    <div className="subheader">Job Images</div>
                    <JobImageTable approvedImages={approvedImages} jobImages={jobImages}/>
                    <div className="subheader">Service Images</div>
                    <ServiceImageTable approvedImages={approvedImages} serviceImages={serviceImages}/>
                </>
            )
        },
    ]

    if (isCurrentUser) {
        tabs.push({
            title: 'Consumers', component: () => (
                <>
                    <div className="subheader">DSP Consumers</div>
                    <DSPConsumersTable dspConsumerData={dspConsumerData}/>
                </>
            )
        })
        tabs.push(
            {title: 'Settings', component: () => <div className="placeholder large">Settings</div>}
        )
    }

    return (
        <div className="page dsp-page">
            <div className="section info-section center-aligned-spaced-row">
                <div className="info">
                    <div className="text-lg">{dspaddr}</div>
                    <div className="center-aligned-row endpoints">
                        <div>Endpoint: <span className="text-md">{endpoint}</span></div>
                        <div>DB Endpoint: <span className="text-md">{dbEndpoint}</span></div>
                    </div>
                </div>
                <div className="center-aligned-row status">
                    <div
                        className={classNames("tag", {active: registered})}>{registered ? 'Registered' : 'Unregistered'}</div>
                    <div className={classNames("tag", {active})}>{active ? 'Active' : 'Inactive'}</div>
                </div>
            </div>
            <div className="placeholder">Dashboard (Gas & Usage)</div>
            <Tabs id="dsp-tabs" tabs={tabs}/>
        </div>
    )
}

export default DspPage