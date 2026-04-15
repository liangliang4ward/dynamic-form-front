/**
 * 表类型枚举
 */
export enum TableType {
  SINGLE = 'single',
  MAIN = 'main',
  SLAVE = 'slave'
}

/**
 * 字段类型枚举
 */
export enum FieldType {
  VARCHAR = 'varchar',
  INT = 'int',
  TEXT = 'text',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time'
}

/**
 * 表单组件类型枚举
 */
export enum FormComponentType {
  INPUT = 'input',
  NUMBER = 'number',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  SELECT = 'select',
  DATE = 'date',
  TIME = 'time',
  RICH_TEXT = 'richText'
}

/**
 * 索引类型枚举
 */
export enum IndexType {
  NORMAL = 'normal',
  UNIQUE = 'unique',
  PRIMARY = 'primary'
}

/**
 * 分组接口
 */
export interface TableGroup {
  id: string
  name: string
  sort: number
}

/**
 * 字段接口
 */
export interface TableField {
  id: string
  fieldName: string
  fieldCode: string
  fieldType: FieldType
  length?: number
  defaultValue?: string
  required: boolean
  isPrimary: boolean
  componentType: FormComponentType
  fieldDesc?: string
  groupId: string
  sort: number
}

/**
 * 索引接口
 */
export interface TableIndex {
  id: string
  indexName: string
  indexType: IndexType
  fieldIds: string[]
  indexDesc?: string
  sort: number
}

/**
 * 表基础信息接口
 */
export interface TableInfo {
  tableName: string
  tableCode: string
  tableDesc?: string
  tableType: TableType
  mainTableCode?: string
}

/**
 * 表完整配置接口
 */
export interface TableConfig {
  id: string
  info: TableInfo
  groups: TableGroup[]
  fields: TableField[]
  indexes: TableIndex[]
  createTime: string
  updateTime: string
}

/**
 * 表列表查询参数
 */
export interface TableListQuery {
  keyword?: string
  page?: number
  pageSize?: number
}

/**
 * 表列表响应
 */
export interface TableListResponse {
  list: TableConfig[]
  total: number
}

/**
 * 校验结果接口
 */
export interface ValidationResult {
  valid: boolean
  message?: string
  field?: string
}
