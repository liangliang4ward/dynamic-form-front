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
 * 查询类型枚举
 */
export enum QueryType {
  EQUAL = 'equal',
  LIKE = 'like',
  RANGE = 'range',
  IN = 'in',
  GREATER = 'greater',
  LESS = 'less',
  GREATER_EQUAL = 'greaterEqual',
  LESS_EQUAL = 'lessEqual'
}

/**
 * 数据来源类型枚举
 */
export enum DataSourceType {
  USER_INPUT = 'userInput',
  LOGIN_INFO = 'loginInfo',
  SYSTEM_DEFAULT = 'systemDefault',
  DICT = 'dict',
  CUSTOM = 'custom'
}

/**
 * 登录信息字段枚举
 */
export enum LoginInfoField {
  USER_ID = 'userId',
  USER_NAME = 'userName',
  DEPT_ID = 'deptId',
  DEPT_NAME = 'deptName',
  ROLE_ID = 'roleId',
  ROLE_NAME = 'roleName',
  TENANT_ID = 'tenantId',
  ORG_ID = 'orgId'
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
 * 查询字段配置接口
 */
export interface QueryField {
  id: string
  fieldId: string
  queryType: QueryType
  sort: number
  enabled: boolean
}

/**
 * 数据来源配置接口
 */
export interface DataSourceConfig {
  type: DataSourceType
  loginInfoField?: LoginInfoField
  dictCode?: string
  customValue?: string
  expression?: string
}

/**
 * 字段显示配置接口
 */
export interface FieldDisplayConfig {
  showInList: boolean
  showInForm: boolean
  showInDetail: boolean
  listWidth?: number
  listSort: number
  formSort: number
  readonly: boolean
  hidden: boolean
  placeholder?: string
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
  dataSource?: DataSourceConfig
  displayConfig?: FieldDisplayConfig
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
  queryFields: QueryField[]
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

/**
 * 数据记录接口（用于数据列表和录入）
 */
export interface DataRecord {
  id: string
  tableId: string
  data: Record<string, any>
  createTime: string
  updateTime: string
  createBy?: string
  updateBy?: string
}

/**
 * 数据列表查询参数
 */
export interface DataListQuery {
  tableId: string
  page?: number
  pageSize?: number
  conditions?: Record<string, any>
}

/**
 * 数据列表响应
 */
export interface DataListResponse {
  list: DataRecord[]
  total: number
}
