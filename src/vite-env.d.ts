interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_BASE_URL?: string  // 新增
  // 更多环境变量可以在这里添加...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
