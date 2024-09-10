module.exports = function override(config, env) {
  config.module.rules.push({
    test: /three\/examples\/js/,
    use: 'imports-loader?THREE=three'
  })
  return config;
}