const path = require('path');
const webpack = require('webpack');
const packageJson = require('./package.json');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'zimporter-html.min.js',
    library: 'zimporter',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.webpack.json',
        },
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
  },
  plugins: [
    new webpack.DefinePlugin({
      __LIB_VERSION__: JSON.stringify(packageJson.version),
    }),
  ],
  mode: 'production',
};
