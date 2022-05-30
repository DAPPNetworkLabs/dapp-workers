import React from 'react';
import './App.module.scss';

import Home from './containers/Home/Home';

// Workers
import Deprecate from './containers/Worker/Deprecate/Deprecate';
import WorkerJobs from './containers/Worker/WorkerJobs/WorkerJobs';
import Register from './containers/Worker/Register/Register';
import RegisterImage from './containers/Worker/RegisterImage/RegisterImage';
import WorkerServices from './containers/Worker/WorkerServices/WorkerServices';
import UpdateImage from './containers/Worker/UpdateImage/UpdateImage';

// Admin
import ApproveImage from './containers/Admin/ApproveImage/ApproveImage';
import SetConfig from './containers/Admin/SetConfig/SetConfig';
import UnapproveImage from './containers/Admin/UnapproveImage/UnapproveImage';

// Consumer
import WorkerInfo from './containers/Consumer/WorkerInfo/WorkerInfo';
import WorkerImages from './containers/Consumer/WorkerImages/WorkerImages';
import BuyGas from './containers/Consumer/BuyGas/BuyGas';
import ExtendService from './containers/Consumer/ExtendService/ExtendService';
import ConsumerJobs from './containers/Consumer/ConsumerJobs/ConsumerJobs';
import RequestJob from './containers/Consumer/RequestJob/RequestJob';
import RequestService from './containers/Consumer/RequestService/RequestService';
import SellGas from './containers/Consumer/SellGas/SellGas';
import ConsumerServices from './containers/Consumer/ConsumerServices/ConsumerServices';
import SetConsumer from './containers/Consumer/SetConsumer/SetConsumer';
import SetWorkers from './containers/Consumer/SetWorkers/SetWorkers';

import { BrowserRouter, Route, Routes } from 'react-router-dom';
function App() {
  
  return (
      <BrowserRouter>
        <Routes>
          <Route path="/worker/register" exact element={<Register/>} />
          <Route path="/worker/deprecate" exact element={<Deprecate/>} />
          <Route path="/worker/register-image" exact element={<RegisterImage/>} />
          <Route path="/worker/update-image" exact element={<UpdateImage/>} />
          <Route path="/worker/jobs" exact element={<WorkerJobs/>} />
          <Route path="/worker/services" exact element={<WorkerServices/>} />

          <Route path="/admin/set-config" exact element={<SetConfig/>} />
          <Route path="/admin/approve-image" exact element={<ApproveImage/>} />
          <Route path="/admin/unapprove-image" exact element={<UnapproveImage/>} />

          <Route path="/consumer/worker-info" exact element={<WorkerInfo/>} />
          <Route path="/consumer/images" exact element={<WorkerImages/>} />
          <Route path="/consumer/buy-gas" exact element={<BuyGas/>} />
          <Route path="/consumer/sell-gas" exact element={<SellGas/>} />
          <Route path="/consumer/request-job" exact element={<RequestJob/>} />
          <Route path="/consumer/request-service" exact element={<RequestService/>} />
          <Route path="/consumer/extend-service" exact element={<ExtendService/>} />
          <Route path="/consumer/jobs" exact element={<ConsumerJobs/>} />
          <Route path="/consumer/services" exact element={<ConsumerServices/>} />
          <Route path="/consumer/set-consumer" exact element={<SetConsumer/>} />
          <Route path="/consumer/set-workers" exact element={<SetWorkers/>} />
          
          <Route path="/" exact element={<Home/>} />
          <Route path="/" element={<Home/>} />
        </Routes>
      </BrowserRouter>
  );
}

export default App;
