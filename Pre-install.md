# 环境安装步骤

## 一、快速安装 Nginx

### Ubuntu/Debian 系统

```bash
# 更新包列表
sudo apt update

# 安装 Nginx
sudo apt install nginx -y

# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx

# 验证安装
nginx -v
```