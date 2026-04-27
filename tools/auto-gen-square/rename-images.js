/**
 * 重命名图片脚本
 * 将 simple-image 中的图片按照服务端命名规则重命名
 */

const fs = require('fs');
const path = require('path');

const prompts = require('./prompts.json');
const simpleImageDir = path.join(__dirname, 'simple-image');

// 从 imageUrl 提取文件名
function getFileNameFromUrl(imageUrl) {
  if (!imageUrl) return null;
  // 例如: /api/file/morpheus-ai/1777013860502-ComfyUI_19080_.png
  const parts = imageUrl.split('/');
  return parts[parts.length - 1];
}

// 获取序号（从 imageId 或其他地方）
function getComfyUISequence(imageId) {
  // imageId: 69eb14648c8ee233902ca42f -> 从数据库自增ID提取
  // 但这里我们直接用 imageUrl 中的序号，如 19080
  return null;
}

// 从 imageUrl 提取 ComfyUI 序号
function extractComfyUISequence(imageUrl) {
  // /api/file/morpheus-ai/1777013860502-ComfyUI_19080_.png
  const match = imageUrl.match(/ComfyUI_(\d+)_?/);
  return match ? match[1] : null;
}

// 从 imageUrl 提取时间戳
function extractTimestamp(imageUrl) {
  // /api/file/morpheus-ai/1777013860502-ComfyUI_19080_.png
  const match = imageUrl.match(/\/(\d+)-ComfyUI/);
  return match ? match[1] : null;
}

// 获取 simple-image 目录下的所有文件
function getFiles(dir) {
  return fs.readdirSync(dir).filter(f => f.endsWith('.png'));
}

// 解析文件获取标题和分辨率
function parseFileName(fileName) {
  const baseName = fileName.replace('.png', '');
  const match = baseName.match(/^(.+?)_(\d+)$/);

  if (match) {
    return {
      title: match[1],
      resolution: match[2]
    };
  } else {
    return {
      title: baseName,
      resolution: 'original'
    };
  }
}

// 创建标题到 imageUrl 的映射
const titleToImageUrl = {};
prompts.forEach(p => {
  titleToImageUrl[p.title] = p.imageUrl;
});

console.log('开始重命名图片...\n');

// 获取所有文件
const files = getFiles(simpleImageDir);
const processed = new Set();

// 按标题分组处理
const titleGroups = {};

files.forEach(fileName => {
  const { title, resolution } = parseFileName(fileName);

  if (!titleGroups[title]) {
    titleGroups[title] = [];
  }
  titleGroups[title].push({ fileName, resolution });
});

console.log(`发现 ${Object.keys(titleGroups).length} 个主题\n`);

let successCount = 0;
let failCount = 0;

// 处理每个主题
for (const [title, files] of Object.entries(titleGroups)) {
  const imageUrl = titleToImageUrl[title];

  if (!imageUrl) {
    console.log(`[跳过] 未找到标题 "${title}" 对应的 imageUrl`);
    failCount++;
    continue;
  }

  const timestamp = extractTimestamp(imageUrl);
  const comfyUISequence = extractComfyUISequence(imageUrl);

  if (!timestamp || !comfyUISequence) {
    console.log(`[跳过] 无法解析 imageUrl: ${imageUrl}`);
    failCount++;
    continue;
  }

  console.log(`处理: ${title}`);
  console.log(`  timestamp: ${timestamp}, sequence: ${comfyUISequence}`);

  // 处理每个分辨率的文件
  files.forEach(({ fileName, resolution }) => {
    let newFileName;

    if (resolution === 'original') {
      // 原图: {timestamp}-ComfyUI_{sequence}.png
      newFileName = `${timestamp}-ComfyUI_${comfyUISequence}.png`;
    } else {
      // 缩略图: {timestamp}-ComfyUI_{sequence}__{resolution}.png
      newFileName = `${timestamp}-ComfyUI_${comfyUISequence}__${resolution}.png`;
    }

    const oldPath = path.join(simpleImageDir, fileName);
    const newPath = path.join(simpleImageDir, newFileName);

    // 检查是否已存在
    if (fs.existsSync(newPath) && oldPath !== newPath) {
      console.log(`  [跳过] 目标文件已存在: ${newFileName}`);
      return;
    }

    if (oldPath !== newPath) {
      fs.renameSync(oldPath, newPath);
      console.log(`  ✓ ${fileName} -> ${newFileName}`);
    } else {
      console.log(`  = ${fileName} (无需重命名)`);
    }

    successCount++;
  });
  console.log('');
}

console.log(`完成! 成功: ${successCount}, 失败: ${failCount}`);