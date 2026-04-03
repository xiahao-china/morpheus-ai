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
          target: 'https://dev.libuli.top/',
          changeOrigin: true,
        },
        '/api/file': {
          target: 'https://dev.libuli.top/',
          changeOrigin: true,
        },
      },
    },
  }
} satisfies UserConfigExport<'webpack5'>
