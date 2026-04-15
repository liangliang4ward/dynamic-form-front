import type {
  TableConfig,
  TableInfo,
  TableGroup,
  TableField,
  TableIndex,
  ValidationResult
} from '@/types/tableTypes'

/**
 * 校验表基础信息
 */
export function validateTableInfo(info: TableInfo, isEdit: boolean = false): ValidationResult {
  if (!info.tableName || info.tableName.trim() === '') {
    return { valid: false, message: '表名称不能为空', field: 'tableName' }
  }
  
  if (!info.tableCode || info.tableCode.trim() === '') {
    return { valid: false, message: '表编码不能为空', field: 'tableCode' }
  }
  
  // 表编码格式校验：只能包含字母、数字、下划线
  const codePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/
  if (!codePattern.test(info.tableCode)) {
    return { valid: false, message: '表编码必须以字母开头，只能包含字母、数字和下划线', field: 'tableCode' }
  }
  
  if (!info.tableType) {
    return { valid: false, message: '请选择表类型', field: 'tableType' }
  }
  
  // 附表必须选择主表
  if (info.tableType === 'slave' && !info.mainTableCode) {
    return { valid: false, message: '附表必须选择关联的主表', field: 'mainTableCode' }
  }
  
  return { valid: true }
}

/**
 * 校验分组列表
 */
export function validateGroups(groups: TableGroup[]): ValidationResult {
  // 检查分组名称是否重复
  const names = groups.map((g) => g.name.trim())
  const uniqueNames = new Set(names)
  
  if (uniqueNames.size !== names.length) {
    return { valid: false, message: '分组名称不能重复' }
  }
  
  // 检查分组名称是否为空
  for (const group of groups) {
    if (!group.name || group.name.trim() === '') {
      return { valid: false, message: '分组名称不能为空' }
    }
  }
  
  return { valid: true }
}

/**
 * 校验单个字段
 */
export function validateField(field: TableField, allFields: TableField[], groups: TableGroup[]): ValidationResult {
  if (!field.fieldName || field.fieldName.trim() === '') {
    return { valid: false, message: '字段名称不能为空', field: 'fieldName' }
  }
  
  if (!field.fieldCode || field.fieldCode.trim() === '') {
    return { valid: false, message: '字段编码不能为空', field: 'fieldCode' }
  }
  
  // 字段编码格式校验
  const codePattern = /^[a-zA-Z][a-zA-Z0-9_]*$/
  if (!codePattern.test(field.fieldCode)) {
    return { valid: false, message: '字段编码必须以字母开头，只能包含字母、数字和下划线', field: 'fieldCode' }
  }
  
  // 检查字段编码是否重复（排除自身）
  const duplicateCode = allFields.some(
    (f) => f.id !== field.id && f.fieldCode === field.fieldCode
  )
  if (duplicateCode) {
    return { valid: false, message: `字段编码 "${field.fieldCode}" 已存在`, field: 'fieldCode' }
  }
  
  if (!field.fieldType) {
    return { valid: false, message: '请选择字段类型', field: 'fieldType' }
  }
  
  if (!field.componentType) {
    return { valid: false, message: '请选择表单组件类型', field: 'componentType' }
  }
  
  // 检查所属分组是否存在
  if (field.groupId && groups.length > 0) {
    const groupExists = groups.some((g) => g.id === field.groupId)
    if (!groupExists) {
      return { valid: false, message: '所属分组不存在', field: 'groupId' }
    }
  }
  
  return { valid: true }
}

/**
 * 校验所有字段
 */
export function validateFields(fields: TableField[], groups: TableGroup[]): ValidationResult {
  // 检查主键数量
  const primaryFields = fields.filter((f) => f.isPrimary)
  if (primaryFields.length > 1) {
    return { valid: false, message: '只能有一个主键字段' }
  }
  
  // 逐个校验字段
  for (const field of fields) {
    const result = validateField(field, fields, groups)
    if (!result.valid) {
      return result
    }
  }
  
  return { valid: true }
}

/**
 * 校验单个索引
 */
export function validateIndex(index: TableIndex, allIndexes: TableIndex[], fields: TableField[]): ValidationResult {
  if (!index.indexName || index.indexName.trim() === '') {
    return { valid: false, message: '索引名称不能为空', field: 'indexName' }
  }
  
  if (!index.indexType) {
    return { valid: false, message: '请选择索引类型', field: 'indexType' }
  }
  
  if (!index.fieldIds || index.fieldIds.length === 0) {
    return { valid: false, message: '请选择关联字段', field: 'fieldIds' }
  }
  
  // 检查关联字段是否都存在
  for (const fieldId of index.fieldIds) {
    const fieldExists = fields.some((f) => f.id === fieldId)
    if (!fieldExists) {
      return { valid: false, message: '关联字段不存在', field: 'fieldIds' }
    }
  }
  
  // 唯一索引和主键索引的字段不能重复
  if (index.indexType === 'unique' || index.indexType === 'primary') {
    const uniqueFieldIds = new Set(index.fieldIds)
    if (uniqueFieldIds.size !== index.fieldIds.length) {
      return { valid: false, message: '唯一索引和主键索引的关联字段不能重复', field: 'fieldIds' }
    }
  }
  
  // 检查主键索引数量
  if (index.indexType === 'primary') {
    const primaryIndexes = allIndexes.filter((i) => i.id !== index.id && i.indexType === 'primary')
    if (primaryIndexes.length > 0) {
      return { valid: false, message: '只能有一个主键索引', field: 'indexType' }
    }
  }
  
  return { valid: true }
}

/**
 * 校验所有索引
 */
export function validateIndexes(indexes: TableIndex[], fields: TableField[]): ValidationResult {
  // 检查主键索引数量
  const primaryIndexes = indexes.filter((i) => i.indexType === 'primary')
  if (primaryIndexes.length > 1) {
    return { valid: false, message: '只能有一个主键索引' }
  }
  
  // 逐个校验索引
  for (const index of indexes) {
    const result = validateIndex(index, indexes, fields)
    if (!result.valid) {
      return result
    }
  }
  
  return { valid: true }
}

/**
 * 校验完整表配置
 */
export function validateTableConfig(config: TableConfig, isEdit: boolean = false): ValidationResult {
  // 校验基础信息
  const infoResult = validateTableInfo(config.info, isEdit)
  if (!infoResult.valid) {
    return infoResult
  }
  
  // 校验分组
  const groupResult = validateGroups(config.groups)
  if (!groupResult.valid) {
    return groupResult
  }
  
  // 校验字段
  const fieldResult = validateFields(config.fields, config.groups)
  if (!fieldResult.valid) {
    return fieldResult
  }
  
  // 校验索引
  const indexResult = validateIndexes(config.indexes, config.fields)
  if (!indexResult.valid) {
    return indexResult
  }
  
  return { valid: true }
}
