const Dotenv = require('dotenv-webpack');
const path = require('path');

module.exports = {
  entry: ['whatwg-fetch', path.resolve(__dirname, 'js', 'app.js')],
  module: {
    loaders: [
      {
        exclude: /node_modules/,
        loader: 'babel-loader',
        test: /\.js$/,
      },
    ],
  },
  plugins: [new Dotenv({
    systemvars: true, 
  })],
  devtool: 'inline-source-map',
  output: {
    filename: 'app.js',
    path: path.resolve(__dirname, 'public')
  },
};
