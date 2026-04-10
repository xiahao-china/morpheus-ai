import Taro from '@tarojs/taro';
import { getIsWeb } from './envCheck';

/**
 * 批量下载文件
 * Web端使用a标签下载，小程序端使用 Taro.downloadFile 和 Taro.saveImageToPhotosAlbum
 * @param urls 要下载的文件URL列表
 * @param delay 下载间隔时间(ms)
 */
export const batchDownload = async (
  urls: string[],
  delay: number = 100
): Promise<void> => {
  if (!urls.length) return;

  const isWeb = getIsWeb();

  if (!isWeb) {
    // 小程序端下载逻辑
    Taro.showLoading({ title: '准备下载...' });

    try {
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        Taro.showLoading({ title: `正在下载 (${i + 1}/${urls.length})` });

        await new Promise<void>((resolve, reject) => {
          // 获取文件扩展名，默认为 .jpg
          let extension = '.jpg';
          if (url.includes('.png')) extension = '.png';
          else if (url.includes('.gif')) extension = '.gif';
          else if (url.includes('.webp')) extension = '.webp';

          // 在小程序中指定 filePath 可以避免 saveImageToPhotosAlbum:fail invalid 报错
          const filePath = `${Taro.env.USER_DATA_PATH}/download_${Date.now()}_${i}${extension}`;

          Taro.downloadFile({
            url: url,
            filePath: filePath,
            success: (res) => {
              if (res.statusCode === 200) {
                Taro.saveImageToPhotosAlbum({
                  filePath: res.filePath || res.tempFilePath,
                  success: () => resolve(),
                  fail: (err) => reject(new Error('保存到相册失败: ' + err.errMsg)),
                });
              } else {
                reject(new Error(`下载失败: ${res.statusCode}`));
              }
            },
            fail: (err) => reject(new Error('下载请求失败: ' + err.errMsg)),
          });
        });

        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      Taro.hideLoading();
      Taro.showToast({ title: '下载完成', icon: 'success' });
    } catch (error) {
      Taro.hideLoading();
      console.error('批量下载出错:', error);
      Taro.showToast({ title: (error as Error).message || '下载出错', icon: 'none' });
    }
    return;
  }

  // Web端下载逻辑（保留原有基于 DOM 的实现）
  const progressBar = document.createElement('div');
  progressBar.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 300px;
    background: white;
    border-radius: 4px;
    padding: 10px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 9999;
  `;

  const progressText = document.createElement('div');
  progressText.style.marginBottom = '8px';
  progressText.style.fontSize = '14px';
  progressText.textContent = '准备开始下载...';

  const progressContainer = document.createElement('div');
  progressContainer.style.height = '6px';
  progressContainer.style.background = 'rgb(182, 182, 182)';
  progressContainer.style.borderRadius = '3px';

  const progressBarFill = document.createElement('div');
  progressBarFill.style.height = '100%';
  progressBarFill.style.width = '0%';
  progressBarFill.style.background = 'linear-gradient(135deg, #409eff 0%, #2D5CF2 100%)';
  progressBarFill.style.borderRadius = '3px';
  progressBarFill.style.transition = 'width 0.3s ease';

  progressContainer.appendChild(progressBarFill);
  progressBar.appendChild(progressText);
  progressBar.appendChild(progressContainer);
  document.body.appendChild(progressBar);

  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const fileName = url.split('/').pop() || `file_${i + 1}`;
      progressText.textContent = `正在下载 (${i + 1}/${urls.length})`;

      // 使用XMLHttpRequest获取文件并跟踪进度
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';

        xhr.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = (e.loaded / e.total) * 100;
            const overallPercent = ((i * 100 + percent) / urls.length);
            progressBarFill.style.width = `${overallPercent}%`;
          }
        };

        xhr.onload = () => {
          if (xhr.status === 200) {
            const blob = xhr.response;
            const headerFilename = xhr.getResponseHeader('Content-Disposition')?.match(/UTF-8''([^']+\.[a-zA-Z0-9]+)$/)?.[1];
            const objectUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = headerFilename || fileName;
            link.style.display = 'none';
            document.body.appendChild(link);

            requestAnimationFrame(() => {
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(objectUrl);
              resolve();
            });
          } else {
            if (xhr.status === 401) {
              document.body.removeChild(progressBar);
              console.info("Unauthorized access - redirecting to login");
              // 跳转到登录页面（Taro 环境）
              Taro.reLaunch({ url: '/pages/LoginPage/index' });
              return;
            }
            reject(new Error(`下载失败: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error('网络错误'));
        xhr.send();
      });

      // 非最后一个文件则添加延迟
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    progressText.textContent = '所有文件下载完成!';
    progressBarFill.style.width = '100%';
  } catch (error) {
    console.error('批量下载出错:', error);
    progressText.textContent = (error as Error).message;
    progressBarFill.style.background = '#ff4444';
  } finally {
    setTimeout(() => {
      document.body.removeChild(progressBar);
    }, 3000);
  }
};
