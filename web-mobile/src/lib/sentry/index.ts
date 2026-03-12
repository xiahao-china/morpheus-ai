import * as Sentry from '@sentry/vue'
import type { App } from 'vue';
import type { IObject } from '@/constants/types';
import { DOMAIN } from '@/constants';
import {SENTRY_DNS} from './const';

export default (app: App<Element>) => {
  // 检查是否已经初始化 Sentry
  if (!(window as IObject).SentryInitialized) {
    Sentry.init({
      app,
      dsn: SENTRY_DNS,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // tracePropagationTargets: [/^https:\/\/(\w+\.test|test|localhost)\.com\.cn(\/.*)?$/],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      release: location.href.match(DOMAIN) ? `production` : `development`,
    });
    (window as IObject).SentryInitialized = true // 标记 Sentry 已初始化
    window.addEventListener('unhandledrejection', (event) => {
      Sentry.captureException(event.reason);
    });

    app.config.errorHandler = error => {
      Sentry.captureException(error);
    }

    Sentry.captureMessage('Sentry 初始化完成');
  }
}

