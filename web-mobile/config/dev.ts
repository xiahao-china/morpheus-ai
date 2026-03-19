import type {UserConfigExport} from "@tarojs/cli";

export default {
  logger: {
    quiet: false,
    stats: true
  },
  mini: {},
  h5: {
    devServer: {
      port: 10086,
      host: '0.0.0.0',
      proxy: {
        '/api/v1': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          pathRewrite: {
            '^/api/v1': '/api'
          }
        },
      },
    },
  }
} satisfies UserConfigExport<'webpack5'>
