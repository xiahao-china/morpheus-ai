import * as Sentry from '@sentry/vue';

export type TransformerFunction<T> = (message: string) => Array<[undefined, T] | [Error, string]>;

export interface SSEReaderOptions<T> {
  transformer?: TransformerFunction<T>
}


export function JsonTransformer<T = object>(message: string): Array<[undefined, T] | [Error, string]> {
  const results: Array<[undefined, T] | [Error, string]> = [];

  // 按行分割消息
  const lines = message.split('\n');
  console.log('lines', lines);

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 跳过空行和注释行
    if (!trimmedLine || trimmedLine.startsWith(':')) {
      continue;
    }

    // 处理 data: 开头的行
    if (trimmedLine.startsWith('data:')) {
      const dataContent = trimmedLine.slice(5).trim(); // 去掉 'data:' 前缀

      // 跳过空数据或特殊标记
      if (!dataContent || dataContent === '[DONE]') {
        continue;
      }

      try {
        const parsed = JSON.parse(dataContent) as T;
        results.push([undefined, parsed]);
      } catch (err) {
        console.warn('Failed to parse SSE data:', dataContent, err);
        results.push([err as Error, trimmedLine]);
      }
    }
  }

  return results;
}

export class SSEReader<T = object> {
  private _stream: ReadableStream<Uint8Array>;
  private _reader?: ReadableStreamDefaultReader<any>;
  private _transformer: TransformerFunction<T>;
  private _onProgress?: (data: T) => void;
  private _onEnd?: () => void;
  private _buffer: string = ''; // 添加缓冲区来处理不完整的消息

  constructor(stream: ReadableStream<Uint8Array>, options?: SSEReaderOptions<T>) {
    this._reader = undefined;
    this._stream = stream;
    this._transformer = options?.transformer || JsonTransformer<T>;
    this._onProgress = undefined;
    this._onEnd = undefined;
  }

  async pip() {
    this._reader = (this._stream as unknown as ReadableStream<any>)
      .pipeThrough(new TextDecoderStream() as any)
      .getReader();
    const reader = this._reader;
    if (!reader) {
      return;
    }

    while (true) {
      const { done, value } = await reader.read();
      console.log('value', done, value);
      if (done) {
        console.log('done-------');
        // 处理缓冲区中剩余的数据
        if (this._buffer.trim()) {
          // 如果剩余数据是 data: 开头的行，直接处理
          if (this._buffer.trim().startsWith('data:')) {
            const messages = this._transformer(this._buffer);
            messages.forEach(([err, data]) => {
              if (err) {
                Sentry.captureException(`SSE message parse error:${JSON.stringify(err)}`);
                console.error('SSE message parse error:', err);
              } else {
                if (typeof this._onProgress === 'function') this._onProgress(data);
              }
            });
          }
        }
        if (typeof this._onEnd === 'function') this._onEnd();
        break;
      }

      // 将新数据添加到缓冲区
      this._buffer += value;

      // 处理缓冲区中的完整消息
      this._processBuffer();
    }
  }

  private _processBuffer() {
    // 处理单行或多行完整的 SSE 消息
    const lines = this._buffer.split('\n');

    // 保留最后一行可能不完整的数据
    this._buffer = lines.pop() || '';

    // 处理所有完整的行
    for (const line of lines) {
      const trimmedLine = line.trim();

      // 如果是 data: 开头的行，直接解析
      if (trimmedLine.startsWith('data:')) {
        const messages = this._transformer(trimmedLine);
        messages.forEach(([err, data]) => {
          if (err) {
            console.error('SSE message parse error:', err);
          } else {
            if (typeof this._onProgress === 'function') this._onProgress(data);
          }
        });
      }
      // 处理双换行符结尾的消息块（兼容标准 SSE）
      else if (trimmedLine === '' && this._buffer.includes('data:')) {
        const handleBuffer = this._buffer.trim();
        // 空结尾消息块但消息未完整时跳过该此处理
        if (handleBuffer[handleBuffer.length - 1] !== '}') {
          continue;
        }
        // 如果遇到空行且缓冲区有数据，处理累积的消息
        const currentBuffer = this._buffer;
        this._buffer = '';

        if (currentBuffer.trim()) {
          const messages = this._transformer(currentBuffer);
          messages.forEach(([err, data]) => {
            if (err) {
              Sentry.captureException(`SSE message parse error:${JSON.stringify(err)}`);
              console.error('SSE message parse error:', err);
            } else {
              if (typeof this._onProgress === 'function') this._onProgress(data);
            }
          });
        }
      }
    }
  }

  onProgress(callback: (data: T) => void) {
    this._onProgress = callback;
    return this;
  }

  onEnd(callback: () => void) {
    this._onEnd = callback;
    return this;
  }

  stop() {
    this._reader?.cancel();
    this._stream.cancel();
  }
}
