
import React, { Component } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { compose } from 'redux';
import { withLocalize } from 'react-localize-redux';

import detectBrowserLanguage from 'detect-browser-language';

import * as trans from '@translations';

const Localize = WrappedComponent => {
  return class Localize extends Component {
    constructor(props) {
      super(props);
      const init = {
        languages: [
          { name: 'English', code: 'en' },
          { name: 'Chinese', code: 'zh' },
          { name: 'Korean', code: 'ko' },
          { name: 'Spanish', code: 'sp' }
        ],
        options: {
          renderToStaticMarkup,
          renderInnerHtml: true,
          ignoreTranslateChildren: true,
          defaultLanguage: (detectBrowserLanguage().substring(0,2) == 'en' | 'ko' | 'zh' | 'sp') ? detectBrowserLanguage().substring(0,2) : 'en'
        }
      };

      this.props.initialize({
        languages: init.languages,
        options: init.options
      });

      this.props.addTranslationForLanguage(trans.en, 'en');
      this.props.addTranslationForLanguage(trans.zh, 'zh');
      this.props.addTranslationForLanguage(trans.ko, 'ko');
      this.props.addTranslationForLanguage(trans.sp, 'sp');
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };
};

export default compose(withLocalize,
  Localize);
