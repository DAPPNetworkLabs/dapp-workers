import React from 'react'
import {useSelector} from "react-redux";
import {dspsSelector} from "store/dsps";
import _ from 'lodash'
import {NavLink} from "react-router-dom"
import './SearchPage.scss'

const SearchPage = () => {

    const dsps = useSelector(dspsSelector)

    return (
        <div className="page search-page">
            {_.map(dsps, (dsp, address) => {
                return (
                    <NavLink key={`dsp-${address}`} className="dsp-link" to={`/dsp/${address}`}>
                        <div className="dsp-item">
                            {address}
                        </div>
                    </NavLink>
                )
            })}
        </div>
    )
}

export default SearchPage