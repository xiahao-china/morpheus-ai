import log4js from 'log4js';

log4js.configure({
  appenders: {
    access: {
      type: 'dateFile',
      filename: 'logs/out',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true,
      layout: {
        type: 'basic'
      },
      numBackups: 4
    },
    console: {
        type: 'console'
    }
  },
  categories: {
    default: {
      appenders: ['console', 'access'],
      level: 'info'
    }
  }
});

export const getLogger = (category = 'access') => {
  return log4js.getLogger(category);
}

export const logger = getLogger();
