import React from 'react'
import Tabs from "components/Tabs";
import {useParams} from "react-router-dom";

const ConsumerPage = () => {
    let { address } = useParams()

    return (
        <div className="page consumer-page">
            <div className="placeholder small">Consumer Info</div>
            <div className="placeholder">Dashboard (Gas & Usage)</div>
            <Tabs id="consumer-tabs" tabs={[
                {title: 'Providers', component: () => <div className="placeholder large">Providers</div> },
                {title: 'Services', component: () => <div className="placeholder large">Services</div> },
                {title: 'Jobs', component: () => <div className="placeholder large">Jobs</div> },
                {title: 'Settings', component: () => <div className="placeholder large">Settings</div> },
            ]}/>
        </div>
    )
}

export default ConsumerPage