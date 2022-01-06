import React from 'react'
import ConsumerPage from "./ConsumerPage";
import DspPage from "./DspPage";
import SearchPage from "./SearchPage";

import { Route, Routes } from 'react-router-dom';

const AppRoutes = () => (
    <Routes>
        <Route path="/consumer/:address" element={<ConsumerPage/>} />
        <Route path="/dsp/:dspaddr" element={<DspPage/>} />
        <Route path="/search" element={<SearchPage/>} />

        <Route path="/" element={<SearchPage/>} />
    </Routes>
)

export default AppRoutes