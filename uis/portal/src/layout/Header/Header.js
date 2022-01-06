import React from 'react'
import "./Header.scss";
// import MainMenu from "layout/MainMenu";
import Dropdown from "components/Dropdown";
import {ACCOUNTS} from "consts";
import {useDispatch, useSelector} from "react-redux";
import _ from 'lodash'
import {NavLink} from "react-router-dom";
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import {faUserCircle} from '@fortawesome/free-solid-svg-icons'

const Header = () => {

    const dispatch = useDispatch()

    const activeAccount = useSelector(state => _.get(state, 'account'))
    const setAccount = account => dispatch({type: 'SET_ACCOUNT', payload: account})

    return (
        <header>
            <div className="logo">
                <NavLink to="/">
                    DAPP<span className="text-bold"><span className="text-lg">W</span>orkers</span>
                </NavLink>
            </div>
            <div className="center-aligned-row toolbar">
                <Dropdown items={_.values(ACCOUNTS)} selectedItem={activeAccount} onItemClick={setAccount} withCaret={true}>{activeAccount.name}</Dropdown>
                <NavLink to={`/${activeAccount.type}/${activeAccount.address}`}><FontAwesomeIcon icon={faUserCircle}/></NavLink>
            </div>
            {/*<MainMenu/>*/}
            {/*<Button*/}
            {/*    login={props.login}*/}
            {/*    logout={props.logout}*/}
            {/*    account={props.account}*/}
            {/*></Button>*/}
        </header>
    )
}

export default Header