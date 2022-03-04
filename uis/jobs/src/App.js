import React, { useState } from 'react';
import './App.module.scss';
import { ThemeProvider } from 'styled-components';
import { lightTheme, darkTheme } from './view/css/theme';
import { GlobalStyles } from './view/css/global';

import Home from './containers/Home/Home';

// Dsps
import Deprecate from './containers/Dsp/Deprecate/Deprecate';
import DspJobs from './containers/Dsp/DspJobs/DspJobs';
import Register from './containers/Dsp/Register/Register';
import RegisterImage from './containers/Dsp/RegisterImage/RegisterImage';
import DspServices from './containers/Dsp/DspServices/DspServices';
import UpdateImage from './containers/Dsp/UpdateImage/UpdateImage';

// Admin
import ApproveImage from './containers/Admin/ApproveImage/ApproveImage';
import SetConfig from './containers/Admin/SetConfig/SetConfig';
import UnapproveImage from './containers/Admin/UnapproveImage/UnapproveImage';

// Consumer
import BuyGas from './containers/Consumer/BuyGas/BuyGas';
import ExtendService from './containers/Consumer/ExtendService/ExtendService';
import ConsumerJobs from './containers/Consumer/ConsumerJobs/ConsumerJobs';
import RequestJob from './containers/Consumer/RequestJob/RequestJob';
import RequestService from './containers/Consumer/RequestService/RequestService';
import SellGas from './containers/Consumer/SellGas/SellGas';
import ConsumerServices from './containers/Consumer/ConsumerServices/ConsumerServices';
import SetConsumer from './containers/Consumer/SetConsumer/SetConsumer';
import SetDsps from './containers/Consumer/SetDsps/SetDsps';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
function App() {
  const [theme, setTheme] = useState('light');
  
  // The function that toggles between themes
  const toggleTheme = () => {
    // if the theme is not light, then set it to dark
    if (theme === 'light') {
      setTheme('dark');
    // otherwise, it should be light
    } else {
      setTheme('light');
    }
  }
  
  return (
    <ThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
      <BrowserRouter>
        <Routes>
          {/* <GlobalStyles /> */}
          <Route path="/dsp/register" exact element={<Register/>} />
          <Route path="/dsp/deprecate" exact element={<Deprecate/>} />
          <Route path="/dsp/register-image" exact element={<RegisterImage/>} />
          <Route path="/dsp/update-image" exact element={<UpdateImage/>} />
          <Route path="/dsp/jobs" exact element={<DspJobs/>} />
          <Route path="/dsp/services" exact element={<DspServices/>} />

          <Route path="/admin/set-config" exact element={<SetConfig/>} />
          <Route path="/admin/approve-image" exact element={<ApproveImage/>} />
          <Route path="/admin/unapprove-image" exact element={<UnapproveImage/>} />

          <Route path="/consumer/buy-gas" exact element={<BuyGas/>} />
          <Route path="/consumer/sell-gas" exact element={<SellGas/>} />
          <Route path="/consumer/request-job" exact element={<RequestJob/>} />
          <Route path="/consumer/request-service" exact element={<RequestService/>} />
          <Route path="/consumer/extend-service" exact element={<ExtendService/>} />
          <Route path="/consumer/jobs" exact element={<ConsumerJobs/>} />
          <Route path="/consumer/services" exact element={<ConsumerServices/>} />
          <Route path="/consumer/set-consumer" exact element={<SetConsumer/>} />
          <Route path="/consumer/set-dsps" exact element={<SetDsps/>} />
          
          <Route path="/" exact element={<Home/>} />
          <Route path="/" element={<Home/>} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
