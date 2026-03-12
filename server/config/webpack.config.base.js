const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const nodeExternals = require('webpack-node-externals')
const fs = require('fs')

// Load config from root
let serverConfig = {};
try {
  const configPath = path.join(__dirname, '../../config.json');
  if (fs.existsSync(configPath)) {
    serverConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
} catch (e) {
  console.error('Failed to load config.json', e);
}

const webpackConfig = {
  target: 'node',
  entry: {
    server: path.join(__dirname, '../src/index.ts')
  },
  output: {
    filename: '[name].bundle.js',
    path: path.join(__dirname, '../dist')
  },
  module: {
    rules: [
      {
        test: /\.js|ts$/,
        use: {
          loader: 'babel-loader'
        },
        include: [path.join(__dirname, '../src')]
      }
    ]
  },
  resolve: {
    modules: [path.join(__dirname, '../src/index.ts'), 'node_modules'],
    extensions: ['.ts', '.js', '.json', '.mjs'],
    alias: {
      '@': path.join(__dirname, '../src')
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV':
        process.env.NODE_ENV === 'production'
          ? JSON.stringify('production')
          : JSON.stringify('development'),
      'process.env.serverConfig': JSON.stringify(serverConfig),
    })
  ],
  externals: [nodeExternals()],
  node: {
    console: true,
    global: true,
    process: true,
    Buffer: true,
    __filename: true,
    __dirname: true,
    setImmediate: true,
    path: true
  }
}

module.exports = webpackConfig
