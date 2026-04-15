<script setup>
import { ref, computed, watch, onMounted, h } from 'vue'

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

// 构建表单规则
const formRules = computed(() => {
  const rules = {}
  
  sortedFields.value.forEach(field => {
    if (field.required && !isFieldReadonly(field)) {
      rules[field.fieldCode] = [
        { required: true, message: `请输入${field.fieldName}`, trigger: 'blur' }
      ]
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
