import type { TableConfig, DataRecord, QueryTemplate } from '@/types/tableTypes'

const STORAGE_KEY = 'dynamic_form_table_configs'
const DATA_STORAGE_KEY = 'dynamic_form_data_records'
const QUERY_TEMPLATE_STORAGE_KEY = 'dynamic_form_query_templates'

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

// ==================== 数据记录存储 ====================

/**
 * 从localStorage获取所有数据记录
 */
export function getAllDataRecords(): DataRecord[] {
  const data = localStorage.getItem(DATA_STORAGE_KEY)
  if (!data) {
    return []
  }
  try {
    return JSON.parse(data) as DataRecord[]
  } catch {
    return []
  }
}

/**
 * 保存所有数据记录到localStorage
 */
export function saveAllDataRecords(records: DataRecord[]): void {
  localStorage.setItem(DATA_STORAGE_KEY, JSON.stringify(records))
}

/**
 * 根据表ID获取数据记录列表
 */
export function getDataRecordsByTableId(tableId: string): DataRecord[] {
  const records = getAllDataRecords()
  return records.filter((r) => r.tableId === tableId)
}

/**
 * 根据ID获取数据记录
 */
export function getDataRecordById(id: string): DataRecord | null {
  const records = getAllDataRecords()
  return records.find((r) => r.id === id) || null
}

/**
 * 保存数据记录（新增或更新）
 */
export function saveDataRecord(record: DataRecord): void {
  const records = getAllDataRecords()
  const index = records.findIndex((r) => r.id === record.id)
  
  const now = new Date().toISOString()
  if (index >= 0) {
    records[index] = { ...record, updateTime: now }
  } else {
    records.push({ ...record, createTime: now, updateTime: now })
  }
  
  saveAllDataRecords(records)
}

/**
 * 根据ID删除数据记录
 */
export function deleteDataRecord(id: string): boolean {
  const records = getAllDataRecords()
  const index = records.findIndex((r) => r.id === id)
  
  if (index >= 0) {
    records.splice(index, 1)
    saveAllDataRecords(records)
    return true
  }
  
  return false
}

/**
 * 根据表ID删除所有数据记录
 */
export function deleteDataRecordsByTableId(tableId: string): number {
  const records = getAllDataRecords()
  const filtered = records.filter((r) => r.tableId !== tableId)
  const deletedCount = records.length - filtered.length
  
  if (deletedCount > 0) {
    saveAllDataRecords(filtered)
  }
  
  return deletedCount
}

// ==================== 查询模板存储 ====================

/**
 * 从localStorage获取所有查询模板
 */
export function getAllQueryTemplates(): QueryTemplate[] {
  const data = localStorage.getItem(QUERY_TEMPLATE_STORAGE_KEY)
  if (!data) {
    return []
  }
  try {
    return JSON.parse(data) as QueryTemplate[]
  } catch {
    return []
  }
}

/**
 * 保存所有查询模板到localStorage
 */
export function saveAllQueryTemplates(templates: QueryTemplate[]): void {
  localStorage.setItem(QUERY_TEMPLATE_STORAGE_KEY, JSON.stringify(templates))
}

/**
 * 根据表ID获取查询模板列表
 */
export function getQueryTemplatesByTableId(tableId: string): QueryTemplate[] {
  const templates = getAllQueryTemplates()
  return templates.filter((t) => t.tableId === tableId)
}

/**
 * 根据ID获取查询模板
 */
export function getQueryTemplateById(id: string): QueryTemplate | null {
  const templates = getAllQueryTemplates()
  return templates.find((t) => t.id === id) || null
}

/**
 * 保存查询模板（新增或更新）
 */
export function saveQueryTemplate(template: QueryTemplate): void {
  const templates = getAllQueryTemplates()
  const index = templates.findIndex((t) => t.id === template.id)
  
  const now = new Date().toISOString()
  if (index >= 0) {
    templates[index] = { ...template, updateTime: now }
  } else {
    templates.push({ ...template, createTime: now, updateTime: now })
  }
  
  saveAllQueryTemplates(templates)
}

/**
 * 根据ID删除查询模板
 */
export function deleteQueryTemplate(id: string): boolean {
  const templates = getAllQueryTemplates()
  const index = templates.findIndex((t) => t.id === id)
  
  if (index >= 0) {
    templates.splice(index, 1)
    saveAllQueryTemplates(templates)
    return true
  }
  
  return false
}

/**
 * 设置默认查询模板
 */
export function setDefaultQueryTemplate(tableId: string, templateId: string): void {
  const templates = getAllQueryTemplates()
  templates.forEach((t) => {
    if (t.tableId === tableId) {
      t.isDefault = t.id === templateId
    }
  })
  saveAllQueryTemplates(templates)
}

/**
 * 获取表的默认查询模板
 */
export function getDefaultQueryTemplate(tableId: string): QueryTemplate | null {
  const templates = getQueryTemplatesByTableId(tableId)
  return templates.find((t) => t.isDefault) || null
}
