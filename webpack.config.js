const path = require('path');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: "production",
  entry: path.resolve(__dirname, './lib/index.ts'),
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: 'ts-loader',
        exclude: path.resolve(__dirname, '/node_modules'),
        options: { allowTsInNodeModules: true }
      },
    ],
  },
  plugins: [
		new NodePolyfillPlugin(),
    new CleanWebpackPlugin()
	],
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    // fallback: {
    //   crypto: require.resolve('crypto-browserify'),
    //   // os: require.resolve('os-browserify/browser'),
    //   // stream: require.resolve('stream-browserify'),
    //   // util: require.resolve('util/')
    // },
  },
  // node: { fs: 'empty' },
  output: {
    filename: 'index.js',
    library: {
      name: "LNC",
      type: "umd",  // see https://webpack.js.org/configuration/output/#outputlibrarytype
      export: "default",  // see https://github.com/webpack/webpack/issues/8480
    },
    path: path.resolve(__dirname, 'dist'),
  },
};
