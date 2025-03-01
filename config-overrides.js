const webpack = require('webpack');

module.exports = function override(config, env) {
  // Add polyfills for Node.js core modules
  const fallback = {
    assert: require.resolve('assert'),
    buffer: require.resolve('buffer'),
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    util: require.resolve('util'),
    zlib: require.resolve('browserify-zlib'),
    path: require.resolve('path-browserify'),
    os: require.resolve('os-browserify/browser'),
    process: false,
    fs: false,
    net: false,
    tls: false
  };

  config.resolve = {
    ...config.resolve,
    fallback
  };

  // Add plugins
  const plugins = [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ];

  // Remove any existing DefinePlugin instances
  config.plugins = config.plugins.filter(plugin => !(plugin instanceof webpack.DefinePlugin));
  
  // Add a single DefinePlugin instance with all environment variables
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  );

  return config;
}; 