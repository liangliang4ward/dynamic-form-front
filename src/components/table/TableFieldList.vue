<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowUp, ArrowDown, Setting } from '@element-plus/icons-vue'
import { generateId } from '@/utils/tableStorage'
import TableFieldAdvancedSettings from './TableFieldAdvancedSettings.vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  groups: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const selectedIds = ref([])

// 高级设置弹窗
const advancedSettingsVisible = ref(false)
const currentEditingField = ref(null)

const fieldTypeOptions = [
  { label: '字符串(varchar)', value: 'varchar' },
  { label: '整数(int)', value: 'int' },
  { label: '文本(text)', value: 'text' },
  { label: '日期(date)', value: 'date' },
  { label: '日期时间(datetime)', value: 'datetime' },
  { label: '时间(time)', value: 'time' }
]

const componentTypeOptions = [
  { label: '输入框', value: 'input' },
  { label: '数字框', value: 'number' },
  { label: '单选', value: 'radio' },
  { label: '多选', value: 'checkbox' },
  { label: '下拉', value: 'select' },
  { label: '日期', value: 'date' },
  { label: '时间', value: 'time' },
  { label: '富文本', value: 'richText' }
]

const sortedFields = computed(() => {
  return [...props.modelValue].sort((a, b) => a.sort - b.sort)
})

const groupOptions = computed(() => {
  return props.groups.map(g => ({
    label: g.name,
    value: g.id
  }))
})

const isAllSelected = computed(() => {
  return sortedFields.value.length > 0 && selectedIds.value.length === sortedFields.value.length
})

const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length < sortedFields.value.length
})

// 创建默认字段（包含默认的高级配置）
const createDefaultField = () => {
  return {
    id: generateId(),
    fieldName: '',
    fieldCode: '',
    fieldType: 'varchar',
    length: undefined,
    defaultValue: '',
    required: false,
    isPrimary: false,
    componentType: 'input',
    fieldDesc: '',
    groupId: '',
    sort: props.modelValue.length,
    dataSource: {
      type: 'userInput'
    },
    displayConfig: {
      showInList: true,
      showInForm: true,
      showInDetail: true,
      listSort: props.modelValue.length,
      formSort: props.modelValue.length,
      readonly: false,
      hidden: false
    },
    queryConfig: {
      id: '',
      enabled: false,
      queryType: 'equal',
      sort: props.modelValue.length
    }
  }
}

const addField = () => {
  if (props.disabled) return

  const newField = createDefaultField()
  emit('update:modelValue', [...props.modelValue, newField])
}

const deleteField = async (field) => {
  if (props.disabled) return

  try {
    await ElMessageBox.confirm(
      `确定要删除字段"${field.fieldName || field.fieldCode}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const newFields = props.modelValue
      .filter(f => f.id !== field.id)
      .map((f, index) => ({ ...f, sort: index }))

    emit('update:modelValue', newFields)
    selectedIds.value = selectedIds.value.filter(id => id !== field.id)
  } catch {
    // 用户取消
  }
}

const batchDelete = async () => {
  if (props.disabled || selectedIds.value.length === 0) return

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个字段吗？`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const newFields = props.modelValue
      .filter(f => !selectedIds.value.includes(f.id))
      .map((f, index) => ({ ...f, sort: index }))

    emit('update:modelValue', newFields)
    selectedIds.value = []
  } catch {
    // 用户取消
  }
}

const clearAllFields = async () => {
  if (props.disabled || props.modelValue.length === 0) return

  try {
    await ElMessageBox.confirm('确定要清空所有字段吗？此操作不可恢复。', '清空确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    emit('update:modelValue', [])
    selectedIds.value = []
  } catch {
    // 用户取消
  }
}

const handleSelectionChange = (val) => {
  selectedIds.value = val.map(v => v.id)
}

const handlePrimaryChange = (field, isPrimary) => {
  if (!isPrimary) {
    updateField(field.id, { isPrimary: false })
    return
  }

  const newFields = props.modelValue.map(f => {
    if (f.id === field.id) {
      return { ...f, isPrimary: true }
    }
    return { ...f, isPrimary: false }
  })

  emit('update:modelValue', newFields)
}

const updateField = (id, updates) => {
  const newFields = props.modelValue.map(f => {
    if (f.id === id) {
      return { ...f, ...updates }
    }
    return f
  })
  emit('update:modelValue', newFields)
}

const moveUp = (index) => {
  if (props.disabled || index <= 0) return

  const newFields = [...props.modelValue]
  const currentSort = newFields.find(f => f.id === sortedFields.value[index].id)?.sort || 0
  const prevSort = newFields.find(f => f.id === sortedFields.value[index - 1].id)?.sort || 0

  newFields.forEach(f => {
    if (f.id === sortedFields.value[index].id) {
      f.sort = prevSort
    } else if (f.id === sortedFields.value[index - 1].id) {
      f.sort = currentSort
    }
  })

  emit('update:modelValue', newFields)
}

const moveDown = (index) => {
  if (props.disabled || index >= sortedFields.value.length - 1) return

  const newFields = [...props.modelValue]
  const currentSort = newFields.find(f => f.id === sortedFields.value[index].id)?.sort || 0
  const nextSort = newFields.find(f => f.id === sortedFields.value[index + 1].id)?.sort || 0

  newFields.forEach(f => {
    if (f.id === sortedFields.value[index].id) {
      f.sort = nextSort
    } else if (f.id === sortedFields.value[index + 1].id) {
      f.sort = currentSort
    }
  })

  emit('update:modelValue', newFields)
}

// 打开高级设置
const openAdvancedSettings = (field) => {
  currentEditingField.value = JSON.parse(JSON.stringify(field))
  advancedSettingsVisible.value = true
}

// 保存高级设置
const saveAdvancedSettings = () => {
  if (!currentEditingField.value) return

  updateField(currentEditingField.value.id, {
    dataSource: currentEditingField.value.dataSource,
    displayConfig: currentEditingField.value.displayConfig,
    queryConfig: currentEditingField.value.queryConfig,
    validationConfig: currentEditingField.value.validationConfig
  })

  advancedSettingsVisible.value = false
  currentEditingField.value = null
  ElMessage.success('保存成功')
}

// 关闭高级设置
const closeAdvancedSettings = () => {
  advancedSettingsVisible.value = false
  currentEditingField.value = null
}

// 获取数据来源类型标签
const getDataSourceTypeLabel = (type) => {
  const labels = {
    userInput: '用户输入',
    loginInfo: '登录信息',
    systemDefault: '系统默认',
    dict: '字典',
    custom: '自定义'
  }
  return type ? labels[type] || '-' : '-'
}

// 获取显示配置摘要
const getDisplaySummary = (config) => {
  if (!config) return '未配置'
  const items = []
  if (config.showInList) items.push('列表')
  if (config.showInForm) items.push('表单')
  if (config.showInDetail) items.push('详情')
  if (config.readonly) items.push('只读')
  if (config.hidden) items.push('隐藏')
  return items.length > 0 ? items.join('、') : '无'
}
</script>

<template>
  <div class="field-list">
    <div class="field-header">
      <span class="title">字段列表</span>
      <div class="header-actions">
        <el-button type="primary" size="small" @click="addField" :disabled="disabled">
          新增字段
        </el-button>
        <el-button
          type="danger"
          size="small"
          @click="batchDelete"
          :disabled="disabled || selectedIds.length === 0"
        >
          批量删除
        </el-button>
        <el-button
          type="danger"
          size="small"
          @click="clearAllFields"
          :disabled="disabled || modelValue.length === 0"
        >
          一键清空
        </el-button>
      </div>
    </div>

    <el-empty v-if="sortedFields.length === 0" description="暂无字段，点击上方按钮添加" />

    <div v-else class="field-table-wrapper">
      <el-table
        :data="sortedFields"
        border
        stripe
        size="small"
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="50" align="center" />

        <el-table-column label="排序" width="70" align="center">
          <template #default="{ $index }">
            <div class="sort-buttons">
              <el-button
                type="text"
                size="small"
                :icon="ArrowUp"
                :disabled="disabled || $index === 0"
                @click="moveUp($index)"
              />
              <el-button
                type="text"
                size="small"
                :icon="ArrowDown"
                :disabled="disabled || $index === sortedFields.length - 1"
                @click="moveDown($index)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="字段名称" min-width="120">
          <template #default="{ row }">
            <el-input
              v-model="row.fieldName"
              placeholder="请输入"
              size="small"
              :disabled="disabled"
            />
          </template>
        </el-table-column>

        <el-table-column label="字段编码" min-width="120">
          <template #default="{ row }">
            <el-input
              v-model="row.fieldCode"
              placeholder="请输入"
              size="small"
              :disabled="disabled"
            />
          </template>
        </el-table-column>

        <el-table-column label="字段类型" width="130">
          <template #default="{ row }">
            <el-select
              v-model="row.fieldType"
              placeholder="请选择"
              size="small"
              style="width: 100%"
              :disabled="disabled"
            >
              <el-option
                v-for="item in fieldTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="长度" width="80">
          <template #default="{ row }">
            <el-input-number
              v-model="row.length"
              :min="1"
              :max="10000"
              size="small"
              style="width: 100%"
              :disabled="disabled"
              controls-position="right"
            />
          </template>
        </el-table-column>

        <el-table-column label="默认值" min-width="100">
          <template #default="{ row }">
            <el-input
              v-model="row.defaultValue"
              placeholder="请输入"
              size="small"
              :disabled="disabled"
            />
          </template>
        </el-table-column>

        <el-table-column label="必填" width="70" align="center">
          <template #default="{ row }">
            <el-switch v-model="row.required" size="small" :disabled="disabled" />
          </template>
        </el-table-column>

        <el-table-column label="主键" width="70" align="center">
          <template #default="{ row }">
            <el-radio
              :model-value="row.isPrimary"
              :value="true"
              @change="handlePrimaryChange(row, true)"
              :disabled="disabled"
            />
          </template>
        </el-table-column>

        <el-table-column label="组件类型" width="100">
          <template #default="{ row }">
            <el-select
              v-model="row.componentType"
              placeholder="请选择"
              size="small"
              style="width: 100%"
              :disabled="disabled"
            >
              <el-option
                v-for="item in componentTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="数据来源" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="row.dataSource?.type === 'userInput' ? '' : 'primary'">
              {{ getDataSourceTypeLabel(row.dataSource?.type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="显示设置" min-width="120" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="display-summary">{{ getDisplaySummary(row.displayConfig) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="字段说明" min-width="120">
          <template #default="{ row }">
            <el-input
              v-model="row.fieldDesc"
              placeholder="请输入"
              size="small"
              :disabled="disabled"
            />
          </template>
        </el-table-column>

        <el-table-column label="排序号" width="80">
          <template #default="{ row }">
            <el-input-number
              v-model="row.sort"
              :min="0"
              size="small"
              style="width: 100%"
              :disabled="disabled"
              controls-position="right"
            />
          </template>
        </el-table-column>

        <el-table-column label="所属分组" width="120">
          <template #default="{ row }">
            <el-select
              v-model="row.groupId"
              placeholder="请选择"
              size="small"
              style="width: 100%"
              :disabled="disabled || groups.length === 0"
              clearable
            >
              <el-option
                v-for="item in groupOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              size="small"
              :icon="Setting"
              @click="openAdvancedSettings(row)"
              :disabled="disabled"
              title="高级设置"
            >
              设置
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="deleteField(row)"
              :disabled="disabled"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-alert
      v-if="sortedFields.length > 0"
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 16px"
    >
      <template #title>
        提示：主键字段只能有一个，设置新主键时会自动取消其他字段的主键设置。点击"设置"按钮可配置字段的数据来源和显示属性。
      </template>
    </el-alert>

    <!-- 高级设置弹窗 -->
    <el-dialog
      v-model="advancedSettingsVisible"
      width="800px"
      :close-on-click-modal="false"
      destroy-on-close
      class="advanced-settings-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <span class="dialog-icon">⚙️</span>
          <div class="dialog-title-info">
            <span class="dialog-title">字段高级设置</span>
            <span class="dialog-subtitle">
              {{ currentEditingField?.fieldName || '未命名字段' }}
              <span v-if="currentEditingField?.fieldCode">({{ currentEditingField.fieldCode }})</span>
            </span>
          </div>
        </div>
      </template>
      
      <div v-if="currentEditingField" class="advanced-settings-content">
        <TableFieldAdvancedSettings
          v-model="currentEditingField"
          :disabled="disabled"
          :allFields="modelValue"
        />
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button size="large" @click="closeAdvancedSettings">
            <span>取消</span>
          </el-button>
          <el-button type="primary" size="large" @click="saveAdvancedSettings">
            <span>保存设置</span>
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.field-list {
  padding: 10px 0;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.field-header .title {
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.field-table-wrapper {
  overflow-x: auto;
}

.sort-buttons {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.sort-buttons .el-button {
  padding: 2px 4px;
}

.display-summary {
  font-size: 12px;
  color: #606266;
}

.advanced-settings-content {
  max-height: 550px;
  overflow-y: auto;
  padding-right: 8px;
}

/* 弹窗样式 */
:deep(.advanced-settings-dialog) {
  .el-dialog__header {
    padding: 20px 24px;
    border-bottom: 1px solid #ebeef5;
    margin-right: 0;
  }
  
  .el-dialog__body {
    padding: 24px;
  }
  
  .el-dialog__footer {
    padding: 16px 24px;
    border-top: 1px solid #ebeef5;
  }
}

.dialog-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.dialog-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  border-radius: 12px;
  font-size: 24px;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.dialog-title-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.dialog-subtitle {
  font-size: 13px;
  color: #909399;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dialog-footer .el-button {
  padding: 12px 28px;
  border-radius: 8px;
  font-weight: 500;
}
</style>
