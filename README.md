### 安装
- node 版本 >= 12
- npm install  安装依赖

### 提交代码规范
```
M ***  // 合并冲突
U ***  // 更新了**
D ***  // 删除了**
F ***  // 修复了**
```
### 快捷新增页面文件
- json 文件会同步新增
- 分包路径与json不会同步新增
```bash
npm run new
```

### 运行环境
**重新编译>需要重启微信开发工具**
```
# 本地IP环境
npm run stage

# 开发环境
npm run dev

# 生产环境
npm run prod
```

### Tips
- 图片要自行压缩