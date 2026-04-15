<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getTableDetail, saveTable, createNewTableConfig } from '@/api/tableMock'
import { validateTableConfig } from '@/utils/tableValidator'
import TableBaseForm from '@/components/table/TableBaseForm.vue'
import TableGroupList from '@/components/table/TableGroupList.vue'
import TableFieldList from '@/components/table/TableFieldList.vue'
import TableIndexList from '@/components/table/TableIndexList.vue'

const router = useRouter()
const route = useRoute()

const baseFormRef = ref()

const activeTab = ref('base')

const loading = ref(false)
const saving = ref(false)

const isViewMode = computed(() => route.query.view === 'true')

const isEditMode = computed(() => !!route.query.id)

const pageTitle = computed(() => {
  if (isViewMode.value) return '查看表配置'
  if (isEditMode.value) return '编辑表配置'
  return '新建表配置'
})

const tableConfig = ref(createNewTableConfig())

const originalConfig = ref(null)

const jsonPreviewVisible = ref(false)

const loadData = async () => {
  const id = route.query.id
  if (!id) return

  loading.value = true
  try {
    const data = await getTableDetail(id)
    if (data) {
      tableConfig.value = JSON.parse(JSON.stringify(data))
      originalConfig.value = JSON.parse(JSON.stringify(data))
    } else {
      ElMessage.error('表配置不存在')
      router.push('/table/list')
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (isViewMode.value) return

  if (baseFormRef.value) {
    const valid = await baseFormRef.value.validate()
    if (!valid) {
      activeTab.value = 'base'
      return
    }
  }

  const validationResult = validateTableConfig(tableConfig.value, isEditMode.value)
  if (!validationResult.valid) {
    ElMessage.error(validationResult.message || '校验失败')
    return
  }

  saving.value = true
  try {
    const result = await saveTable(tableConfig.value)
    if (result.success) {
      ElMessage.success(result.message)
      originalConfig.value = JSON.parse(JSON.stringify(tableConfig.value))
      router.push('/table/list')
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  } finally {
    saving.value = false
  }
}

const handleReset = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有配置吗？此操作将清空表基础信息、所有字段、索引和分组。',
      '重置确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    tableConfig.value = createNewTableConfig()
    originalConfig.value = null
    baseFormRef.value?.clearValidate()
    ElMessage.success('已重置')
  } catch {
    // 用户取消
  }
}

const handlePreview = () => {
  jsonPreviewVisible.value = true
}

const formattedJson = computed(() => {
  return JSON.stringify(tableConfig.value, null, 2)
})

const handleBack = () => {
  router.push('/table/list')
}

const hasUnsavedChanges = computed(() => {
  if (!originalConfig.value) {
    return (
      tableConfig.value.info.tableName !== '' ||
      tableConfig.value.info.tableCode !== '' ||
      tableConfig.value.groups.length > 0 ||
      tableConfig.value.fields.length > 0 ||
      tableConfig.value.indexes.length > 0
    )
  }
  return JSON.stringify(tableConfig.value) !== JSON.stringify(originalConfig.value)
})

const handleBeforeUnload = e => {
  if (hasUnsavedChanges.value && !isViewMode.value) {
    e.preventDefault()
    e.returnValue = '您有未保存的更改，确定要离开吗？'
    return e.returnValue
  }
}

const removeRouteGuard = router.beforeEach((to, from, next) => {
  if (hasUnsavedChanges.value && !isViewMode.value && to.path !== '/table/edit') {
    ElMessageBox.confirm('您有未保存的更改，确定要离开吗？', '提示', {
      confirmButtonText: '确定离开',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(() => {
        removeRouteGuard()
        next()
      })
      .catch(() => {
        next(false)
      })
  } else {
    next()
  }
})

onMounted(() => {
  loadData()
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  removeRouteGuard()
})
</script>

<template>
  <div class="table-edit-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button type="primary" link @click="handleBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="title">{{ pageTitle }}</span>
          </div>
          <div class="header-right" v-if="!isViewMode">
            <el-button @click="handleReset">重置</el-button>
            <el-button @click="handlePreview">预览配置</el-button>
            <el-button type="primary" :loading="saving" @click="handleSave"> 保存 </el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="基础信息" name="base">
          <TableBaseForm
            ref="baseFormRef"
            v-model="tableConfig.info"
            :table-id="tableConfig.id"
            :disabled="isViewMode"
          />

          <el-divider />

          <TableGroupList v-model="tableConfig.groups" :disabled="isViewMode" />
        </el-tab-pane>

        <el-tab-pane label="字段列表" name="fields">
          <TableFieldList
            v-model="tableConfig.fields"
            :groups="tableConfig.groups"
            :disabled="isViewMode"
          />
        </el-tab-pane>

        <el-tab-pane label="索引列表" name="indexes">
          <TableIndexList
            v-model="tableConfig.indexes"
            :fields="tableConfig.fields"
            :disabled="isViewMode"
          />
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog
      v-model="jsonPreviewVisible"
      title="配置预览 (JSON)"
      width="700px"
      :close-on-click-modal="false"
    >
      <div class="json-preview">
        <pre><code>{{ formattedJson }}</code></pre>
      </div>
      <template #footer>
        <el-button @click="jsonPreviewVisible = false">关闭</el-button>
        <el-button
          type="primary"
          @click="
            navigator.clipboard.writeText(formattedJson)
            ElMessage.success('已复制到剪贴板')
          "
        >
          复制
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.table-edit-page {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left .title {
  font-size: 18px;
  font-weight: 600;
}

.header-right {
  display: flex;
  gap: 8px;
}

.json-preview {
  max-height: 500px;
  overflow: auto;
  background-color: #f5f7fa;
  border-radius: 4px;
  padding: 16px;
}

.json-preview pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.json-preview code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #303133;
}
</style>
