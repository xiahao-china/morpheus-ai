import type {UserConfigExport} from "@tarojs/cli";

export default {
  logger: {
    quiet: false,
    stats: true
  },
  mini: {},
  h5: {
    devServer: {
      proxy: {
        '/api/v1': {
          // target: 'http://113.108.105.54:8186',
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
          pathRewrite: {
            '^/api/v1': '/api'
          }
        },
      },
    },
  }
} satisfies UserConfigExport<'webpack5'>
