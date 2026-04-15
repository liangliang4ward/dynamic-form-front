<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { generateId } from '@/utils/tableStorage'

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

const indexTypeOptions = [
  { label: '普通索引', value: 'normal' },
  { label: '唯一索引', value: 'unique' },
  { label: '主键索引', value: 'primary' }
]

const sortedIndexes = computed(() => {
  return [...props.modelValue].sort((a, b) => a.sort - b.sort)
})

const fieldOptions = computed(() => {
  return props.fields.map(f => ({
    label: `${f.fieldName || f.fieldCode} (${f.fieldCode})`,
    value: f.id
  }))
})

const createDefaultIndex = () => {
  return {
    id: generateId(),
    indexName: '',
    indexType: 'normal',
    fieldIds: [],
    indexDesc: '',
    sort: props.modelValue.length
  }
}

const addIndex = () => {
  if (props.disabled) return

  if (props.fields.length === 0) {
    ElMessage.warning('请先添加字段')
    return
  }

  const newIndex = createDefaultIndex()
  emit('update:modelValue', [...props.modelValue, newIndex])
}

const deleteIndex = async index => {
  if (props.disabled) return

  try {
    await ElMessageBox.confirm(`确定要删除索引"${index.indexName}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const newIndexes = props.modelValue
      .filter(i => i.id !== index.id)
      .map((i, idx) => ({ ...i, sort: idx }))

    emit('update:modelValue', newIndexes)
  } catch {
    // 用户取消
  }
}

const handleIndexTypeChange = (index, newType) => {
  if (newType !== 'primary') {
    updateIndex(index.id, { indexType: newType })
    return
  }

  const newIndexes = props.modelValue.map(i => {
    if (i.id === index.id) {
      return { ...i, indexType: 'primary' }
    }
    return { ...i, indexType: i.indexType === 'primary' ? 'normal' : i.indexType }
  })

  emit('update:modelValue', newIndexes)
}

const updateIndex = (id, updates) => {
  const newIndexes = props.modelValue.map(i => {
    if (i.id === id) {
      return { ...i, ...updates }
    }
    return i
  })
  emit('update:modelValue', newIndexes)
}

const moveUp = index => {
  if (props.disabled || index <= 0) return

  const newIndexes = [...props.modelValue]
  const currentSort = newIndexes.find(i => i.id === sortedIndexes.value[index].id)?.sort || 0
  const prevSort = newIndexes.find(i => i.id === sortedIndexes.value[index - 1].id)?.sort || 0

  newIndexes.forEach(i => {
    if (i.id === sortedIndexes.value[index].id) {
      i.sort = prevSort
    } else if (i.id === sortedIndexes.value[index - 1].id) {
      i.sort = currentSort
    }
  })

  emit('update:modelValue', newIndexes)
}

const moveDown = index => {
  if (props.disabled || index >= sortedIndexes.value.length - 1) return

  const newIndexes = [...props.modelValue]
  const currentSort = newIndexes.find(i => i.id === sortedIndexes.value[index].id)?.sort || 0
  const nextSort = newIndexes.find(i => i.id === sortedIndexes.value[index + 1].id)?.sort || 0

  newIndexes.forEach(i => {
    if (i.id === sortedIndexes.value[index].id) {
      i.sort = nextSort
    } else if (i.id === sortedIndexes.value[index + 1].id) {
      i.sort = currentSort
    }
  })

  emit('update:modelValue', newIndexes)
}
</script>

<template>
  <div class="index-list">
    <div class="index-header">
      <span class="title">索引列表</span>
      <el-button type="primary" size="small" @click="addIndex" :disabled="disabled">
        新增索引
      </el-button>
    </div>

    <el-empty v-if="sortedIndexes.length === 0" description="暂无索引，点击上方按钮添加" />

    <div v-else class="index-table-wrapper">
      <el-table :data="sortedIndexes" border stripe size="small" style="width: 100%">
        <el-table-column label="排序" width="80" align="center">
          <template #default="{ $index }">
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
              :disabled="disabled || $index === sortedIndexes.length - 1"
              @click="moveDown($index)"
            />
          </template>
        </el-table-column>

        <el-table-column label="索引名称" min-width="150">
          <template #default="{ row }">
            <el-input
              v-model="row.indexName"
              placeholder="请输入索引名称"
              size="small"
              :disabled="disabled"
            />
          </template>
        </el-table-column>

        <el-table-column label="索引类型" width="120">
          <template #default="{ row }">
            <el-select
              v-model="row.indexType"
              placeholder="请选择"
              size="small"
              style="width: 100%"
              :disabled="disabled"
              @change="val => handleIndexTypeChange(row, val)"
            >
              <el-option
                v-for="item in indexTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="关联字段" min-width="200">
          <template #default="{ row }">
            <el-select
              v-model="row.fieldIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择关联字段"
              size="small"
              style="width: 100%"
              :disabled="disabled || fields.length === 0"
              filterable
            >
              <el-option
                v-for="item in fieldOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </template>
        </el-table-column>

        <el-table-column label="索引说明" min-width="200">
          <template #default="{ row }">
            <el-input
              v-model="row.indexDesc"
              type="textarea"
              :rows="1"
              placeholder="请输入索引说明"
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

        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-button
              type="danger"
              link
              size="small"
              @click="deleteIndex(row)"
              :disabled="disabled"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-alert
      v-if="sortedIndexes.length > 0"
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 16px"
    >
      <template #title>
        提示：主键索引只能有一个，设置新主键索引时会自动取消其他索引的主键类型。唯一索引和主键索引的关联字段不能重复。
      </template>
    </el-alert>
  </div>
</template>

<style scoped>
.index-list {
  padding: 10px 0;
}

.index-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.index-header .title {
  font-size: 16px;
  font-weight: 600;
}

.index-table-wrapper {
  overflow-x: auto;
}
</style>
