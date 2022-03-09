const { alias } = require('react-app-rewire-alias');

module.exports = function override(config) {
  alias({
    '@lib': 'src/lib/index',
    '@helpers': 'src/view/helpers/helpers',
    '@view': 'src/view',
    '@containers': 'src/containers',
    '@components': 'src/components',
    '@icons': 'src/view/assets/icons',
    '@logos': 'src/view/assets/logos',
    '@loc': 'src/view/texts/texts',
    '@translations': 'src/translations/index',
    '@texts': 'src/view/texts',
    '@auth': 'src/store/actions/auth'
  })(config);

  return config;
};