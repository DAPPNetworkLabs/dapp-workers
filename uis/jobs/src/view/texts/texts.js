import * as trans from '@translations';

function resolve(path, obj, separator='.') {
  var properties = Array.isArray(path) ? path : path.split(separator)
  return properties.reduce((prev, curr) => prev && prev[curr], obj)
}

export function loc(textKey, lang, ...args) {
  let text = resolve(textKey,trans[lang]) || textKey;
  if (args) {
    for (let arg of args)
      text = text.replace('%s', arg);
  }
  return text;
}
