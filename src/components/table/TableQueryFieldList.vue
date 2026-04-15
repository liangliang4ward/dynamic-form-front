<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { generateId } from '@/utils/tableStorage'
import { QueryField, TableField, QueryType } from '@/types/tableTypes'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true
  },
  fields: {
    type: Array,
    default: () => []
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// 查询类型选项
const queryTypeOptions = [
  { label: '等于', value: 'equal' as QueryType },
  { label: '模糊匹配', value: 'like' as QueryType },
  { label: '范围查询', value: 'range' as QueryType },
  { label: '包含', value: 'in' as QueryType },
  { label: '大于', value: 'greater' as QueryType },
  { label: '小于', value: 'less' as QueryType },
  { label: '大于等于', value: 'greaterEqual' as QueryType },
  { label: '小于等于', value: 'lessEqual' as QueryType }
]

// 排序后的查询字段
const sortedQueryFields = computed(() => {
  return [...props.modelValue].sort((a, b) => a.sort - b.sort)
})

// 可选字段列表（排除已添加的）
const availableFields = computed(() => {
  const addedFieldIds = props.modelValue.map(qf => qf.fieldId)
  return props.fields.filter(f => !addedFieldIds.includes(f.id))
})

// 字段选项
const fieldOptions = computed(() => {
  return props.fields.map(f => ({
    label: `${f.fieldName || f.fieldCode} (${f.fieldCode})`,
    value: f.id
  }))
})

// 获取字段信息
const getFieldInfo = (fieldId: string) => {
  return props.fields.find(f => f.id === fieldId)
}

// 创建默认查询字段
const createDefaultQueryField = (fieldId: string): QueryField => {
  return {
    id: generateId(),
    fieldId,
    queryType: 'equal' as QueryType,
    sort: props.modelValue.length,
    enabled: true
  }
}

// 添加查询字段
const addQueryField = (fieldId: string) => {
  if (props.disabled) return

  if (!fieldId) {
    ElMessage.warning('请选择字段')
    return
  }

  const newQueryField = createDefaultQueryField(fieldId)
  emit('update:modelValue', [...props.modelValue, newQueryField])
}

// 批量添加所有可用字段
const addAllAvailableFields = () => {
  if (props.disabled || availableFields.value.length === 0) return

  const newQueryFields = availableFields.value.map((field, index) => ({
    ...createDefaultQueryField(field.id),
    sort: props.modelValue.length + index
  }))

  emit('update:modelValue', [...props.modelValue, ...newQueryFields])
}

// 删除查询字段
const deleteQueryField = (queryField: QueryField) => {
  if (props.disabled) return

  const newQueryFields = props.modelValue
    .filter(qf => qf.id !== queryField.id)
    .map((qf, index) => ({ ...qf, sort: index }))

  emit('update:modelValue', newQueryFields)
}

// 更新查询字段
const updateQueryField = (id: string, updates: Partial<QueryField>) => {
  const newQueryFields = props.modelValue.map(qf => {
    if (qf.id === id) {
      return { ...qf, ...updates }
    }
    return qf
  })
  emit('update:modelValue', newQueryFields)
}

// 上移
const moveUp = (index: number) => {
  if (props.disabled || index <= 0) return

  const newQueryFields = [...props.modelValue]
  const currentSort = newQueryFields.find(qf => qf.id === sortedQueryFields.value[index].id)?.sort || 0
  const prevSort = newQueryFields.find(qf => qf.id === sortedQueryFields.value[index - 1].id)?.sort || 0

  newQueryFields.forEach(qf => {
    if (qf.id === sortedQueryFields.value[index].id) {
      qf.sort = prevSort
    } else if (qf.id === sortedQueryFields.value[index - 1].id) {
      qf.sort = currentSort
    }
  })

  emit('update:modelValue', newQueryFields)
}

// 下移
const moveDown = (index: number) => {
  if (props.disabled || index >= sortedQueryFields.value.length - 1) return

  const newQueryFields = [...props.modelValue]
  const currentSort = newQueryFields.find(qf => qf.id === sortedQueryFields.value[index].id)?.sort || 0
  const nextSort = newQueryFields.find(qf => qf.id === sortedQueryFields.value[index + 1].id)?.sort || 0

  newQueryFields.forEach(qf => {
    if (qf.id === sortedQueryFields.value[index].id) {
      qf.sort = nextSort
    } else if (qf.id === sortedQueryFields.value[index + 1].id) {
      qf.sort = currentSort
    }
  })

  emit('update:modelValue', newQueryFields)
}
</script>

<template>
  <div class="query-field-list">
    <div class="query-field-header">
      <span class="title">查询字段配置</span>
      <div class="header-actions">
        <el-select
          v-if="availableFields.length > 0"
          placeholder="选择字段添加"
          size="small"
          style="width: 200px"
          :disabled="disabled"
          @change="addQueryField"
          filterable
        >
          <el-option
            v-for="field in availableFields"
            :key="field.id"
            :label="`${field.fieldName || field.fieldCode} (${field.fieldCode})`"
            :value="field.id"
          />
        </el-select>
        <el-button
          v-if="availableFields.length > 0"
          type="primary"
          size="small"
          @click="addAllAvailableFields"
          :disabled="disabled"
        >
          全部添加
        </el-button>
      </div>
    </div>

    <el-empty v-if="sortedQueryFields.length === 0" description="暂无查询字段，请从上方选择字段添加" />

    <div v-else class="query-field-table-wrapper">
      <el-table :data="sortedQueryFields" border stripe size="small" style="width: 100%">
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
                :disabled="disabled || $index === sortedQueryFields.length - 1"
                @click="moveDown($index)"
              />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="字段名称" min-width="150">
          <template #default="{ row }">
            <span>{{ getFieldInfo(row.fieldId)?.fieldName || getFieldInfo(row.fieldId)?.fieldCode || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="字段编码" min-width="150">
          <template #default="{ row }">
            <span>{{ getFieldInfo(row.fieldId)?.fieldCode || '-' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="查询类型" width="150">
          <template #default="{ row }">
            <el-select
              v-model="row.queryType"
              placeholder="请选择查询类型"
              size="small"
              style="width: 100%"
              :disabled="disabled"
              @change="val => updateQueryField(row.id, { queryType: val })"
            >
              <el-option
                v-for="item in queryTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              size="small"
              :disabled="disabled"
              @change="val => updateQueryField(row.id, { enabled: val })"
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
              @change="val => updateQueryField(row.id, { sort: val })"
            />
          </template>
        </el-table-column>

        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="danger"
              link
              size="small"
              @click="deleteQueryField(row)"
              :disabled="disabled"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-alert
      v-if="sortedQueryFields.length > 0"
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 16px"
    >
      <template #title>
        提示：查询字段用于数据列表页面的搜索条件。启用的字段将显示在搜索区域，用户可以根据这些字段进行数据查询。
      </template>
    </el-alert>
  </div>
</template>

<style scoped>
.query-field-list {
  padding: 10px 0;
}

.query-field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.query-field-header .title {
  font-size: 16px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.query-field-table-wrapper {
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
</style>
