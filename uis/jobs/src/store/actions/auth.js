import * as actionTypes from './actionTypes';

export const setLang = (lang) => {
  return {
    type: actionTypes.SET_LANG,
    lang: lang
  };
};

export const setIsLangUserSelected = (isLangUserSelected) => {
  return {
    type: actionTypes.SET_ISLANGUSERSELECTED,
    isLangUserSelected: isLangUserSelected
  };
};
