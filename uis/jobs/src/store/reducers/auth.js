import * as actionTypes from '../actions/actionTypes';
import { updateObject } from '../utility';
import detectBrowserLanguage from 'detect-browser-language';

const initialState = {
  lang: detectBrowserLanguage().substring(0,2),
  isLangUserSelected: false,
  isDayNight: true
};

const setLang = (state, action) => {
  if (action.lang === 'en')
    return updateObject(state, { lang: action.lang });

  else if (action.lang === 'zh')
    return updateObject(state, { lang: action.lang });

  else if (action.lang === 'ko')
    return updateObject(state, { lang: action.lang });
};

const setIsLangUserSelected = (state, action) => {
  return updateObject(state, { isLangUserSelected: action.isLangUserSelected });
};

const setIsDayNight = (state, action) => {
  return updateObject(state, { isDayNight: action.isDayNight });
};

const reducer = (state = initialState, action) => {
  switch (action.type) {
    case actionTypes.SET_LANG: return setLang(state, action);
    case actionTypes.SET_ISLANGUSERSELECTED: return setIsLangUserSelected(state, action);
    case actionTypes.SET_ISDAYSELECTED: return setIsDayNight(state, action);
    default: return state;
  }
};

export default reducer;
