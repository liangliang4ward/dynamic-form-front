import type { TableConfig } from '@/types/tableTypes'

const STORAGE_KEY = 'dynamic_form_table_configs'

/**
 * 从localStorage获取所有表配置
 */
export function getAllTableConfigs(): TableConfig[] {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) {
    return []
  }
  try {
    return JSON.parse(data) as TableConfig[]
  } catch {
    return []
  }
}

/**
 * 保存所有表配置到localStorage
 */
export function saveAllTableConfigs(configs: TableConfig[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(configs))
}

/**
 * 根据ID获取表配置
 */
export function getTableConfigById(id: string): TableConfig | null {
  const configs = getAllTableConfigs()
  return configs.find((config) => config.id === id) || null
}

/**
 * 保存单个表配置（新增或更新）
 */
export function saveTableConfig(config: TableConfig): void {
  const configs = getAllTableConfigs()
  const index = configs.findIndex((c) => c.id === config.id)
  
  if (index >= 0) {
    configs[index] = config
  } else {
    configs.push(config)
  }
  
  saveAllTableConfigs(configs)
}

/**
 * 根据ID删除表配置
 */
export function deleteTableConfig(id: string): boolean {
  const configs = getAllTableConfigs()
  const index = configs.findIndex((c) => c.id === id)
  
  if (index >= 0) {
    configs.splice(index, 1)
    saveAllTableConfigs(configs)
    return true
  }
  
  return false
}

/**
 * 检查表编码是否唯一
 * @param code 表编码
 * @param excludeId 排除的ID（编辑时使用）
 */
export function isTableCodeUnique(code: string, excludeId?: string): boolean {
  const configs = getAllTableConfigs()
  return !configs.some((c) => c.info.tableCode === code && c.id !== excludeId)
}

/**
 * 获取所有主表列表
 */
export function getMainTableList(): TableConfig[] {
  const configs = getAllTableConfigs()
  return configs.filter((c) => c.info.tableType === 'main')
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}
