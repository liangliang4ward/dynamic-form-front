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
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const editingId = ref(null)
const editingName = ref('')

const sortedGroups = computed(() => {
  return [...props.modelValue].sort((a, b) => a.sort - b.sort)
})

const startEdit = group => {
  if (props.disabled) return
  editingId.value = group.id
  editingName.value = group.name
}

const cancelEdit = () => {
  editingId.value = null
  editingName.value = ''
}

const saveEdit = group => {
  if (!editingName.value.trim()) {
    ElMessage.warning('分组名称不能为空')
    return
  }

  const duplicate = props.modelValue.some(
    g => g.id !== group.id && g.name.trim() === editingName.value.trim()
  )
  if (duplicate) {
    ElMessage.warning('分组名称不能重复')
    return
  }

  const newGroups = props.modelValue.map(g => {
    if (g.id === group.id) {
      return { ...g, name: editingName.value.trim() }
    }
    return g
  })

  emit('update:modelValue', newGroups)
  cancelEdit()
}

const addGroup = () => {
  if (props.disabled) return

  const newGroup = {
    id: generateId(),
    name: '',
    sort: props.modelValue.length
  }

  emit('update:modelValue', [...props.modelValue, newGroup])
  editingId.value = newGroup.id
  editingName.value = ''
}

const deleteGroup = async group => {
  if (props.disabled) return

  try {
    await ElMessageBox.confirm(`确定要删除分组"${group.name}"吗？`, '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const newGroups = props.modelValue
      .filter(g => g.id !== group.id)
      .map((g, index) => ({ ...g, sort: index }))

    emit('update:modelValue', newGroups)
  } catch {
    // 用户取消
  }
}

const moveUp = index => {
  if (props.disabled || index <= 0) return

  const newGroups = [...props.modelValue]
  const temp = { ...newGroups[index], sort: index - 1 }
  newGroups[index] = { ...newGroups[index - 1], sort: index }
  newGroups[index - 1] = temp

  emit('update:modelValue', newGroups)
}

const moveDown = index => {
  if (props.disabled || index >= props.modelValue.length - 1) return

  const newGroups = [...props.modelValue]
  const temp = { ...newGroups[index], sort: index + 1 }
  newGroups[index] = { ...newGroups[index + 1], sort: index }
  newGroups[index + 1] = temp

  emit('update:modelValue', newGroups)
}
</script>

<template>
  <div class="group-list">
    <div class="group-header">
      <span class="title">分组管理</span>
      <el-button type="primary" size="small" @click="addGroup" :disabled="disabled">
        新增分组
      </el-button>
    </div>

    <el-empty v-if="sortedGroups.length === 0" description="暂无分组，点击上方按钮添加" />

    <div v-else class="group-items">
      <div
        v-for="(group, index) in sortedGroups"
        :key="group.id"
        class="group-item"
        :class="{ 'is-editing': editingId === group.id }"
      >
        <div class="group-sort">
          <el-button
            type="text"
            size="small"
            :icon="ArrowUp"
            :disabled="disabled || index === 0"
            @click="moveUp(index)"
          />
          <el-button
            type="text"
            size="small"
            :icon="ArrowDown"
            :disabled="disabled || index === sortedGroups.length - 1"
            @click="moveDown(index)"
          />
        </div>

        <div class="group-content">
          <template v-if="editingId === group.id">
            <el-input
              v-model="editingName"
              size="small"
              placeholder="请输入分组名称"
              @keyup.enter="saveEdit(group)"
              maxlength="50"
              show-word-limit
              autofocus
            />
          </template>
          <template v-else>
            <span class="group-name">{{ group.name || '未命名分组' }}</span>
          </template>
        </div>

        <div class="group-actions">
          <template v-if="editingId === group.id">
            <el-button type="primary" size="small" @click="saveEdit(group)"> 保存 </el-button>
            <el-button size="small" @click="cancelEdit"> 取消 </el-button>
          </template>
          <template v-else>
            <el-button
              type="primary"
              link
              size="small"
              @click="startEdit(group)"
              :disabled="disabled"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              link
              size="small"
              @click="deleteGroup(group)"
              :disabled="disabled"
            >
              删除
            </el-button>
          </template>
        </div>
      </div>
    </div>

    <el-alert
      v-if="sortedGroups.length > 0"
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 16px"
    >
      <template #title> 提示：分组用于对表字段进行分类展示，字段可以归属到某个分组下。 </template>
    </el-alert>
  </div>
</template>

<style scoped>
.group-list {
  padding: 10px 0;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.group-header .title {
  font-size: 16px;
  font-weight: 600;
}

.group-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.group-item.is-editing {
  background-color: #ecf5ff;
  border-color: #409eff;
}

.group-sort {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-content {
  flex: 1;
}

.group-name {
  font-size: 14px;
  color: #303133;
}

.group-actions {
  display: flex;
  gap: 8px;
}
</style>
