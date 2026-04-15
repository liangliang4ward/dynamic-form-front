import type {
  TableConfig,
  TableListQuery,
  TableListResponse,
  DataRecord,
  DataListQuery,
  DataListResponse
} from '@/types/tableTypes'
import {
  getAllTableConfigs,
  getTableConfigById,
  saveTableConfig,
  deleteTableConfig,
  isTableCodeUnique,
  getMainTableList,
  generateId,
  getAllDataRecords,
  getDataRecordsByTableId,
  getDataRecordById,
  saveDataRecord,
  deleteDataRecord
} from '@/utils/tableStorage'

/**
 * 模拟API延迟
 */
function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 获取表配置列表
 */
export async function getTableList(query: TableListQuery = {}): Promise<TableListResponse> {
  await delay()
  
  let configs = getAllTableConfigs()
  
  // 关键字搜索
  if (query.keyword) {
    const keyword = query.keyword.toLowerCase()
    configs = configs.filter(
      (c) =>
        c.info.tableName.toLowerCase().includes(keyword) ||
        c.info.tableCode.toLowerCase().includes(keyword)
    )
  }
  
  // 按创建时间倒序
  configs.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
  
  return {
    list: configs,
    total: configs.length
  }
}

/**
 * 获取表配置详情
 */
export async function getTableDetail(id: string): Promise<TableConfig | null> {
  await delay()
  return getTableConfigById(id)
}

/**
 * 保存表配置
 */
export async function saveTable(config: TableConfig): Promise<{ success: boolean; message: string }> {
  await delay()
  
  // 检查表编码唯一性
  if (!isTableCodeUnique(config.info.tableCode, config.id)) {
    return {
      success: false,
      message: '表编码已存在，请使用其他编码'
    }
  }
  
  // 确保queryFields存在
  if (!config.queryFields) {
    config.queryFields = []
  }
  
  // 更新时间
  const now = new Date().toISOString()
  if (!config.createTime) {
    config.createTime = now
  }
  config.updateTime = now
  
  saveTableConfig(config)
  
  return {
    success: true,
    message: '保存成功'
  }
}

/**
 * 删除表配置
 */
export async function deleteTable(id: string): Promise<{ success: boolean; message: string }> {
  await delay()
  
  const result = deleteTableConfig(id)
  
  if (result) {
    return {
      success: true,
      message: '删除成功'
    }
  }
  
  return {
    success: false,
    message: '删除失败，表配置不存在'
  }
}

/**
 * 检查表编码是否唯一
 */
export async function checkTableCode(code: string, excludeId?: string): Promise<{ unique: boolean }> {
  await delay(100)
  return {
    unique: isTableCodeUnique(code, excludeId)
  }
}

/**
 * 获取主表列表
 */
export async function getMainTables(): Promise<TableConfig[]> {
  await delay()
  return getMainTableList()
}

/**
 * 生成新的表配置（带默认值）
 */
export function createNewTableConfig(): TableConfig {
  return {
    id: generateId(),
    info: {
      tableName: '',
      tableCode: '',
      tableDesc: '',
      tableType: 'single' as const,
      mainTableCode: undefined
    },
    groups: [],
    fields: [],
    indexes: [],
    queryFields: [],
    createTime: '',
    updateTime: ''
  }
}

// ==================== 数据记录API ====================

/**
 * 获取数据列表
 */
export async function getDataList(query: DataListQuery): Promise<DataListResponse> {
  await delay()
  
  let records = getDataRecordsByTableId(query.tableId)
  
  // 简单的条件过滤（Mock实现）
  if (query.conditions && Object.keys(query.conditions).length > 0) {
    records = records.filter(record => {
      for (const [key, value] of Object.entries(query.conditions!)) {
        if (value === undefined || value === null || value === '') continue
        const recordValue = record.data[key]
        if (recordValue === undefined || recordValue === null) return false
        // 简单的包含匹配
        if (!String(recordValue).toLowerCase().includes(String(value).toLowerCase())) {
          return false
        }
      }
      return true
    })
  }
  
  // 按创建时间倒序
  records.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
  
  // 分页
  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pagedRecords = records.slice(start, end)
  
  return {
    list: pagedRecords,
    total: records.length
  }
}

/**
 * 获取数据记录详情
 */
export async function getDataDetail(id: string): Promise<DataRecord | null> {
  await delay()
  return getDataRecordById(id)
}

/**
 * 保存数据记录
 */
export async function saveData(record: DataRecord): Promise<{ success: boolean; message: string; id: string }> {
  await delay()
  
  const isNew = !record.id
  if (isNew) {
    record.id = generateId()
  }
  
  saveDataRecord(record)
  
  return {
    success: true,
    message: isNew ? '新增成功' : '更新成功',
    id: record.id
  }
}

/**
 * 删除数据记录
 */
export async function deleteData(id: string): Promise<{ success: boolean; message: string }> {
  await delay()
  
  const result = deleteDataRecord(id)
  
  if (result) {
    return {
      success: true,
      message: '删除成功'
    }
  }
  
  return {
    success: false,
    message: '删除失败，数据不存在'
  }
}

/**
 * 生成新的数据记录（带默认值）
 */
export function createNewDataRecord(tableId: string): DataRecord {
  return {
    id: '',
    tableId,
    data: {},
    createTime: '',
    updateTime: ''
  }
}
