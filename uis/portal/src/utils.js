import _ from 'lodash'

export const makeReducer = (actionHandlers={}, initialState={}, globalReset = true) => (state=initialState, action) => {
    if (action.type === 'RESET_STATE' && globalReset) {
        return  initialState
    }
    if (_.isFunction(actionHandlers[action.type])) {
        return actionHandlers[action.type](state, action)
    }
    return state
}

export const reduceSetFull = (state, action) => action.payload

export const reduceUpdateFull = (state, action) => ({...state, ...action.payload})

export const reducePushPayload = (state, action) => ([...state, action.payload])

export const reduceSetKey = key => (state, action) => ({
    ...state,
    [key]: action.payload,
})