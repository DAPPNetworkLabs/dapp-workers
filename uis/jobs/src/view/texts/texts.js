import * as trans from '@translations';

export function loc(textKey, lang, ...args) {
  let text = trans[lang][textKey] || textKey;
  if (args) {
    for (let arg of args)
      text = text.replace('%s', arg);
  }
  return text;
}
