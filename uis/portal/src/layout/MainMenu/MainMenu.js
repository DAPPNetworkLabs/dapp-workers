import React from 'react'
import "./MainMenu.scss";
import {NavLink} from "react-router-dom";

const MainMenu = () => {
    return (
        <div className="main-menu">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/consumer">Consumer</NavLink>
            <NavLink to="/dsp">DSP</NavLink>
        </div>
    )
}

export default MainMenu