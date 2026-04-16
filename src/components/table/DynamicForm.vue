<script setup>
import { ref, computed, watch, onMounted, h } from 'vue'
import { ValidationRuleType, RelatedValidationType } from '@/types/tableTypes'

const props = defineProps({
  fields: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Object,
    default: () => ({})
  },
  disabled: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'form'
  }
})

// ==================== 验证规则相关工具函数 ====================

// 检查值是否为空
const isEmptyValue = (value) => {
  if (value === null || value === undefined || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

// 获取默认错误消息
const getDefaultErrorMessage = (ruleType, fieldName) => {
  const messages = {
    [ValidationRuleType.REQUIRED]: `请输入${fieldName}`,
    [ValidationRuleType.PATTERN]: `${fieldName}格式不正确`,
    [ValidationRuleType.LENGTH]: `${fieldName}长度不符合要求`,
    [ValidationRuleType.NUMBER_RANGE]: `${fieldName}数值不在有效范围内`,
    [ValidationRuleType.DATE_RANGE]: `${fieldName}日期不在有效范围内`,
    [ValidationRuleType.EMAIL]: `请输入有效的邮箱地址`,
    [ValidationRuleType.PHONE]: `请输入有效的手机号码`,
    [ValidationRuleType.ID_CARD]: `请输入有效的身份证号码`,
    [ValidationRuleType.URL]: `请输入有效的URL地址`,
    [ValidationRuleType.INTEGER]: `${fieldName}必须是整数`,
    [ValidationRuleType.DECIMAL]: `${fieldName}格式不正确`,
    [ValidationRuleType.RELATED_FIELD]: `${fieldName}验证失败`
  }
  return messages[ruleType] || `${fieldName}验证失败`
}

// 创建必填验证规则
const createRequiredRule = (rule, fieldName) => {
  return {
    required: true,
    message: rule.errorMessage || getDefaultErrorMessage(ValidationRuleType.REQUIRED, fieldName),
    trigger: 'blur'
  }
}

// 创建正则验证规则
const createPatternRule = (rule, fieldName) => {
  if (!rule.pattern) return null
  
  try {
    const regex = new RegExp(rule.pattern, rule.patternFlags || '')
    return {
      validator: (rule, value, callback) => {
        if (isEmptyValue(value)) {
          callback()
          return
        }
        if (!regex.test(String(value))) {
          callback(new Error(rule.errorMessage || getDefaultErrorMessage(ValidationRuleType.PATTERN, fieldName)))
          return
        }
        callback()
      },
      trigger: 'blur'
    }
  } catch {
    return null
  }
}

// 创建长度验证规则
const createLengthRule = (rule, fieldName) => {
  const { minLength, maxLength } = rule
  if (minLength === undefined && maxLength === undefined) return null
  
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      const strValue = String(value)
      if (minLength !== undefined && strValue.length < minLength) {
        callback(new Error(rule.errorMessage || `${fieldName}长度不能小于${minLength}个字符`))
        return
      }
      if (maxLength !== undefined && strValue.length > maxLength) {
        callback(new Error(rule.errorMessage || `${fieldName}长度不能大于${maxLength}个字符`))
        return
      }
      callback()
    },
    trigger: 'blur'
  }
}

// 创建数值范围验证规则
const createNumberRangeRule = (rule, fieldName) => {
  const { minValue, maxValue } = rule
  if (minValue === undefined && maxValue === undefined) return null
  
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      const numValue = Number(value)
      if (isNaN(numValue)) {
        callback(new Error(`${fieldName}必须是数字`))
        return
      }
      if (minValue !== undefined && numValue < minValue) {
        callback(new Error(rule.errorMessage || `${fieldName}不能小于${minValue}`))
        return
      }
      if (maxValue !== undefined && numValue > maxValue) {
        callback(new Error(rule.errorMessage || `${fieldName}不能大于${maxValue}`))
        return
      }
      callback()
    },
    trigger: 'blur'
  }
}

// 创建日期范围验证规则
const createDateRangeRule = (rule, fieldName) => {
  const { minDate, maxDate } = rule
  if (!minDate && !maxDate) return null
  
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      const dateValue = new Date(value)
      if (isNaN(dateValue.getTime())) {
        callback(new Error(`${fieldName}格式不正确`))
        return
      }
      if (minDate) {
        const minDateValue = new Date(minDate)
        if (dateValue < minDateValue) {
          callback(new Error(rule.errorMessage || `${fieldName}不能早于${minDate}`))
          return
        }
      }
      if (maxDate) {
        const maxDateValue = new Date(maxDate)
        if (dateValue > maxDateValue) {
          callback(new Error(rule.errorMessage || `${fieldName}不能晚于${maxDate}`))
          return
        }
      }
      callback()
    },
    trigger: 'change'
  }
}

// 创建邮箱验证规则
const createEmailRule = (rule, fieldName) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      if (!emailRegex.test(String(value))) {
        callback(new Error(rule.errorMessage || getDefaultErrorMessage(ValidationRuleType.EMAIL, fieldName)))
        return
      }
      callback()
    },
    trigger: 'blur'
  }
}

// 创建手机号验证规则
const createPhoneRule = (rule, fieldName) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      if (!phoneRegex.test(String(value))) {
        callback(new Error(rule.errorMessage || getDefaultErrorMessage(ValidationRuleType.PHONE, fieldName)))
        return
      }
      callback()
    },
    trigger: 'blur'
  }
}

// 创建身份证号验证规则
const createIdCardRule = (rule, fieldName) => {
  const idCardRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      if (!idCardRegex.test(String(value))) {
        callback(new Error(rule.errorMessage || getDefaultErrorMessage(ValidationRuleType.ID_CARD, fieldName)))
        return
      }
      callback()
    },
    trigger: 'blur'
  }
}

// 创建URL验证规则
const createUrlRule = (rule, fieldName) => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      if (!urlRegex.test(String(value))) {
        callback(new Error(rule.errorMessage || getDefaultErrorMessage(ValidationRuleType.URL, fieldName)))
        return
      }
      callback()
    },
    trigger: 'blur'
  }
}

// 创建整数验证规则
const createIntegerRule = (rule, fieldName) => {
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      const numValue = Number(value)
      if (isNaN(numValue) || !Number.isInteger(numValue)) {
        callback(new Error(rule.errorMessage || getDefaultErrorMessage(ValidationRuleType.INTEGER, fieldName)))
        return
      }
      callback()
    },
    trigger: 'blur'
  }
}

// 创建小数验证规则
const createDecimalRule = (rule, fieldName) => {
  const { decimalPlaces } = rule
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      const numValue = Number(value)
      if (isNaN(numValue)) {
        callback(new Error(`${fieldName}必须是数字`))
        return
      }
      if (decimalPlaces !== undefined) {
        const strValue = String(value)
        const decimalMatch = strValue.match(/\.(\d+)$/)
        if (decimalMatch && decimalMatch[1].length > decimalPlaces) {
          callback(new Error(rule.errorMessage || `${fieldName}最多允许${decimalPlaces}位小数`))
          return
        }
      }
      callback()
    },
    trigger: 'blur'
  }
}

// 创建关联字段验证规则
const createRelatedFieldRule = (rule, fieldName, field, allFields) => {
  const { relatedValidationType, relatedFieldId } = rule
  if (!relatedValidationType || !relatedFieldId) return null
  
  const relatedField = allFields.find(f => f.id === relatedFieldId)
  if (!relatedField) return null
  
  return {
    validator: (rule, value, callback) => {
      if (isEmptyValue(value)) {
        callback()
        return
      }
      
      const relatedValue = formData.value[relatedField.fieldCode]
      if (isEmptyValue(relatedValue)) {
        callback()
        return
      }
      
      switch (relatedValidationType) {
        case RelatedValidationType.PASSWORD_CONFIRM:
          if (String(value) !== String(relatedValue)) {
            callback(new Error(rule.errorMessage || `与${relatedField.fieldName}不一致`))
            return
          }
          break
          
        case RelatedValidationType.DATE_AFTER:
          const dateValue = new Date(value)
          const relatedDateValue = new Date(relatedValue)
          if (!isNaN(dateValue.getTime()) && !isNaN(relatedDateValue.getTime())) {
            if (dateValue <= relatedDateValue) {
              callback(new Error(rule.errorMessage || `${fieldName}必须晚于${relatedField.fieldName}`))
              return
            }
          }
          break
          
        case RelatedValidationType.DATE_BEFORE:
          const dateValueBefore = new Date(value)
          const relatedDateValueBefore = new Date(relatedValue)
          if (!isNaN(dateValueBefore.getTime()) && !isNaN(relatedDateValueBefore.getTime())) {
            if (dateValueBefore >= relatedDateValueBefore) {
              callback(new Error(rule.errorMessage || `${fieldName}必须早于${relatedField.fieldName}`))
              return
            }
          }
          break
          
        case RelatedValidationType.NUMBER_GREATER_THAN:
          const numValue = Number(value)
          const relatedNumValue = Number(relatedValue)
          if (!isNaN(numValue) && !isNaN(relatedNumValue)) {
            if (numValue <= relatedNumValue) {
              callback(new Error(rule.errorMessage || `${fieldName}必须大于${relatedField.fieldName}`))
              return
            }
          }
          break
          
        case RelatedValidationType.NUMBER_LESS_THAN:
          const numValueLess = Number(value)
          const relatedNumValueLess = Number(relatedValue)
          if (!isNaN(numValueLess) && !isNaN(relatedNumValueLess)) {
            if (numValueLess >= relatedNumValueLess) {
              callback(new Error(rule.errorMessage || `${fieldName}必须小于${relatedField.fieldName}`))
              return
            }
          }
          break
      }
      
      callback()
    },
    trigger: 'blur'
  }
}

const emit = defineEmits(['update:modelValue'])

// 表单引用
const formRef = ref()

// 本地表单数据
const formData = ref({ ...props.modelValue })

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    formData.value = { ...newVal }
  },
  { deep: true }
)

// 模拟登录信息（Mock）
const mockLoginInfo = computed(() => ({
  userId: '1001',
  userName: '张三',
  deptId: 'D001',
  deptName: '技术部',
  roleId: 'R001',
  roleName: '管理员',
  tenantId: 'T001',
  orgId: 'O001'
}))

// 根据显示配置过滤字段
const filteredFields = computed(() => {
  return props.fields.filter(field => {
    const displayConfig = field.displayConfig
    if (!displayConfig) return true
    
    // 隐藏的字段不显示
    if (displayConfig.hidden) return false
    
    // 根据模式过滤
    if (props.mode === 'form' && !displayConfig.showInForm) return false
    if (props.mode === 'detail' && !displayConfig.showInDetail) return false
    
    return true
  })
})

// 按表单排序号排序
const sortedFields = computed(() => {
  return [...filteredFields.value].sort((a, b) => {
    const sortA = a.displayConfig?.formSort ?? a.sort
    const sortB = b.displayConfig?.formSort ?? b.sort
    return sortA - sortB
  })
})

// 获取字段值
const getFieldValue = (field) => {
  return formData.value[field.fieldCode]
}

// 设置字段值
const setFieldValue = (field, value) => {
  formData.value[field.fieldCode] = value
  emit('update:modelValue', { ...formData.value })
}

// 检查字段是否只读
const isFieldReadonly = (field) => {
  if (props.readonly || props.disabled) return true
  if (field.displayConfig?.readonly) return true
  
  // 数据来源不是用户输入的，视为只读
  const dataSourceType = field.dataSource?.type
  return dataSourceType && dataSourceType !== 'userInput'
}

// 获取登录信息值
const getLoginInfoValue = (loginInfoField) => {
  if (!loginInfoField) return undefined
  return mockLoginInfo.value[loginInfoField]
}

// 获取数据来源的默认值
const getDataSourceDefaultValue = (field) => {
  const dataSource = field.dataSource
  if (!dataSource) return field.defaultValue

  switch (dataSource.type) {
    case 'loginInfo':
      return getLoginInfoValue(dataSource.loginInfoField)
    case 'systemDefault':
      return field.defaultValue
    case 'custom':
      return dataSource.customValue || field.defaultValue
    default:
      return field.defaultValue
  }
}

// 初始化表单数据（根据数据来源设置默认值）
const initFormData = () => {
  // 只在新增时初始化（modelValue为空时）
  if (Object.keys(props.modelValue).length === 0) {
    const initialData = {}
    
    props.fields.forEach(field => {
      const defaultValue = getDataSourceDefaultValue(field)
      if (defaultValue !== undefined && defaultValue !== null && defaultValue !== '') {
        initialData[field.fieldCode] = defaultValue
      }
    })
    
    if (Object.keys(initialData).length > 0) {
      formData.value = initialData
      emit('update:modelValue', { ...initialData })
    }
  }
}

// 获取占位符
const getPlaceholder = (field) => {
  return field.displayConfig?.placeholder || `请输入${field.fieldName}`
}

// 处理输入变化
const handleInputChange = (field, value) => {
  formData.value[field.fieldCode] = value
  emit('update:modelValue', { ...formData.value })
}

// 从验证规则配置构建 Element Plus 表单规则
const buildFieldRules = (field) => {
  const fieldRules = []
  const fieldName = field.fieldName
  
  // 处理必填验证（兼容旧的 required 属性）
  if (field.required && !isFieldReadonly(field)) {
    fieldRules.push({
      required: true,
      message: `请输入${fieldName}`,
      trigger: 'blur'
    })
  }
  
  // 处理自定义验证规则
  const validationConfig = field.validationConfig
  if (validationConfig && validationConfig.rules && validationConfig.rules.length > 0) {
    validationConfig.rules.forEach(rule => {
      // 跳过未启用的规则
      if (!rule.enabled) return
      
      let formRule = null
      
      switch (rule.type) {
        case ValidationRuleType.REQUIRED:
          formRule = createRequiredRule(rule, fieldName)
          break
        case ValidationRuleType.PATTERN:
          formRule = createPatternRule(rule, fieldName)
          break
        case ValidationRuleType.LENGTH:
          formRule = createLengthRule(rule, fieldName)
          break
        case ValidationRuleType.NUMBER_RANGE:
          formRule = createNumberRangeRule(rule, fieldName)
          break
        case ValidationRuleType.DATE_RANGE:
          formRule = createDateRangeRule(rule, fieldName)
          break
        case ValidationRuleType.EMAIL:
          formRule = createEmailRule(rule, fieldName)
          break
        case ValidationRuleType.PHONE:
          formRule = createPhoneRule(rule, fieldName)
          break
        case ValidationRuleType.ID_CARD:
          formRule = createIdCardRule(rule, fieldName)
          break
        case ValidationRuleType.URL:
          formRule = createUrlRule(rule, fieldName)
          break
        case ValidationRuleType.INTEGER:
          formRule = createIntegerRule(rule, fieldName)
          break
        case ValidationRuleType.DECIMAL:
          formRule = createDecimalRule(rule, fieldName)
          break
        case ValidationRuleType.RELATED_FIELD:
          formRule = createRelatedFieldRule(rule, fieldName, field, props.fields)
          break
      }
      
      if (formRule) {
        fieldRules.push(formRule)
      }
    })
  }
  
  return fieldRules
}

// 构建表单规则
const formRules = computed(() => {
  const rules = {}
  
  sortedFields.value.forEach(field => {
    const fieldRules = buildFieldRules(field)
    if (fieldRules.length > 0) {
      rules[field.fieldCode] = fieldRules
    }
  })
  
  return rules
})

// 校验表单
const validate = async () => {
  if (!formRef.value) return true
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

// 清除校验
const clearValidate = () => {
  formRef.value?.clearValidate()
}

// 重置表单
const resetFields = () => {
  formRef.value?.resetFields()
}

defineExpose({
  validate,
  clearValidate,
  resetFields
})

onMounted(() => {
  initFormData()
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    :disabled="disabled"
    label-width="120px"
  >
    <el-row :gutter="20">
      <el-col
        v-for="field in sortedFields"
        :key="field.id"
        :span="field.fieldType === 'text' || field.componentType === 'richText' ? 24 : 12"
      >
        <el-form-item
          :label="field.fieldName"
          :prop="field.fieldCode"
        >
          <!-- 详情模式 -->
          <template v-if="mode === 'detail'">
            <span class="detail-value">{{ getFieldValue(field) ?? '-' }}</span>
          </template>

          <!-- 输入框 -->
          <el-input
            v-else-if="field.componentType === 'input'"
            v-model="formData[field.fieldCode]"
            :placeholder="getPlaceholder(field)"
            :disabled="disabled"
            :readonly="isFieldReadonly(field)"
            clearable
            @input="handleInputChange(field, formData[field.fieldCode])"
          />

          <!-- 数字框 -->
          <el-input-number
            v-else-if="field.componentType === 'number'"
            v-model="formData[field.fieldCode]"
            :placeholder="getPlaceholder(field)"
            :disabled="disabled"
            :readonly="isFieldReadonly(field)"
            controls-position="right"
            style="width: 100%"
            @change="handleInputChange(field, formData[field.fieldCode])"
          />

          <!-- 单选 -->
          <el-radio-group
            v-else-if="field.componentType === 'radio'"
            v-model="formData[field.fieldCode]"
            :disabled="disabled || isFieldReadonly(field)"
            @change="handleInputChange(field, formData[field.fieldCode])"
          >
            <el-radio label="是">是</el-radio>
            <el-radio label="否">否</el-radio>
          </el-radio-group>

          <!-- 多选 -->
          <el-checkbox-group
            v-else-if="field.componentType === 'checkbox'"
            v-model="formData[field.fieldCode]"
            :disabled="disabled || isFieldReadonly(field)"
            @change="handleInputChange(field, formData[field.fieldCode])"
          >
            <el-checkbox label="选项1">选项1</el-checkbox>
            <el-checkbox label="选项2">选项2</el-checkbox>
            <el-checkbox label="选项3">选项3</el-checkbox>
          </el-checkbox-group>

          <!-- 下拉 -->
          <el-select
            v-else-if="field.componentType === 'select'"
            v-model="formData[field.fieldCode]"
            :placeholder="getPlaceholder(field)"
            :disabled="disabled"
            :readonly="isFieldReadonly(field)"
            clearable
            filterable
            style="width: 100%"
            @change="handleInputChange(field, formData[field.fieldCode])"
          >
            <el-option label="选项1" value="option1" />
            <el-option label="选项2" value="option2" />
            <el-option label="选项3" value="option3" />
          </el-select>

          <!-- 日期 -->
          <el-date-picker
            v-else-if="field.componentType === 'date'"
            v-model="formData[field.fieldCode]"
            type="date"
            :placeholder="getPlaceholder(field)"
            :disabled="disabled"
            :readonly="isFieldReadonly(field)"
            clearable
            style="width: 100%"
            value-format="YYYY-MM-DD"
            @change="handleInputChange(field, formData[field.fieldCode])"
          />

          <!-- 时间 -->
          <el-time-picker
            v-else-if="field.componentType === 'time'"
            v-model="formData[field.fieldCode]"
            :placeholder="getPlaceholder(field)"
            :disabled="disabled"
            :readonly="isFieldReadonly(field)"
            clearable
            style="width: 100%"
            value-format="HH:mm:ss"
            @change="handleInputChange(field, formData[field.fieldCode])"
          />

          <!-- 富文本/文本域 -->
          <el-input
            v-else-if="field.componentType === 'richText'"
            v-model="formData[field.fieldCode]"
            type="textarea"
            :rows="4"
            :placeholder="getPlaceholder(field)"
            :disabled="disabled"
            :readonly="isFieldReadonly(field)"
            @input="handleInputChange(field, formData[field.fieldCode])"
          />

          <!-- 默认输入框 -->
          <el-input
            v-else
            v-model="formData[field.fieldCode]"
            :placeholder="getPlaceholder(field)"
            :disabled="disabled"
            :readonly="isFieldReadonly(field)"
            clearable
            @input="handleInputChange(field, formData[field.fieldCode])"
          />

          <!-- 字段说明 -->
          <div v-if="field.fieldDesc" class="field-desc">
            {{ field.fieldDesc }}
          </div>

          <!-- 数据来源提示 -->
          <div v-if="field.dataSource && field.dataSource.type !== 'userInput'" class="data-source-tip">
            <el-tag size="small" type="info">
              数据来源：
              {{
                field.dataSource.type === 'loginInfo' ? '登录信息' :
                field.dataSource.type === 'systemDefault' ? '系统默认' :
                field.dataSource.type === 'dict' ? '数据字典' :
                field.dataSource.type === 'custom' ? '自定义' : '用户输入'
              }}
            </el-tag>
          </div>
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<style scoped>
.field-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.data-source-tip {
  margin-top: 4px;
}

.detail-value {
  color: #303133;
  line-height: 32px;
}
</style>
