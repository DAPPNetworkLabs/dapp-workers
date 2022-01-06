import React, {useEffect, useState} from 'react'
import _ from 'lodash'
import './Tabs.scss'
import classNames from "classnames";

const Tabs = ({id, tabs, activeTab: inActiveTab = 0, before, after}) => {

    const [activeTab, setActiveTab] = useState(inActiveTab)

    useEffect(() => {
        if (activeTab >= _.size(tabs)) {
            setActiveTab(0)
        }
    }, [_.size(tabs)])

    if (activeTab >= _.size(tabs)) return null

    return (
        <div className="tabs">
            {_.size(tabs) > 1 && (
                <div className="center-aligned-row tabs-header">
                    {_.map(tabs, ({title, hidden}, i) => !hidden && (
                        <div key={`tab-header-${id}-${i}`}
                             className={classNames("tab-header", {active: i === activeTab})}
                             onClick={() => setActiveTab(i)}>{title}</div>
                    ))}
                </div>
            )}
            <div className="active-tab">
                {_.isFunction(before) && before()}
                {tabs[activeTab].component()}
                {_.isFunction(after) && after()}
            </div>
        </div>
    )
}

export default Tabs
