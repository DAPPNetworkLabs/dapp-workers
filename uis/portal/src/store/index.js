import {createStore, applyMiddleware, combineReducers} from 'redux';
import thunk from 'redux-thunk';
import {createLogger} from 'redux-logger';
import { composeWithDevTools } from 'redux-devtools-extension'
import dspsReducer from "store/dsps";
import {makeReducer, reduceSetFull} from "utils";
import {ACCOUNTS, DSP1_ADDRESS} from "consts";

const rootReducer = combineReducers({
    dsps: dspsReducer,
    account: makeReducer({
        SET_ACCOUNT: reduceSetFull,
    }, ACCOUNTS[DSP1_ADDRESS])
})

const logger = createLogger({
    predicate: (store, {type}) => {
        // console.log(action)
        return type !== 'SET_API_STATUS'
    }
})
// export const makeStore = () => createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk)));
export const makeStore = () => createStore(rootReducer, composeWithDevTools(applyMiddleware(thunk, logger)));