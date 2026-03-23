const path = require('path')
const webpack = require('webpack')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const nodeExternals = require('webpack-node-externals')
const fs = require('fs')

// Load config from root
let serverConfig = {};
const appEnv = (process.env.APP_ENV || '').toLowerCase();
const lifecycleEvent = (process.env.npm_lifecycle_event || '').toLowerCase();
let configFileName = 'config.json';

if (
  appEnv === 'dev' ||
  lifecycleEvent === 'serve' ||
  lifecycleEvent === 'server'
) {
  configFileName = 'config.dev.json';
} else if (
  appEnv === 'test' ||
  lifecycleEvent === 'build:test'
) {
  configFileName = 'config.test.json';
} else if (appEnv === 'prod' || appEnv === 'production') {
  configFileName = 'config.prod.json';
}

try {
  const configPath = path.join(__dirname, `../../${configFileName}`);
  if (fs.existsSync(configPath)) {
    serverConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } else {
    // If specific config not found, try default config.json
    const defaultConfigPath = path.join(__dirname, '../../config.json');
    if (fs.existsSync(defaultConfigPath)) {
        serverConfig = JSON.parse(fs.readFileSync(defaultConfigPath, 'utf8'));
    }
  }
} catch (e) {
  console.error(`Failed to load config from ${configFileName}`, e);
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
