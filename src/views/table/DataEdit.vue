<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getTableDetail, getDataDetail, saveData } from '@/api/tableMock'
import DynamicForm from '@/components/table/DynamicForm.vue'

const router = useRouter()
const route = useRoute()

// 表单引用
const dynamicFormRef = ref()

// 表配置
const tableConfig = ref(null)
const loading = ref(false)
const saving = ref(false)

// 表单数据
const formData = ref({})

// 获取参数
const tableId = computed(() => route.query.tableId)
const dataId = computed(() => route.query.id)
const isViewMode = computed(() => route.query.view === 'true')
const isEditMode = computed(() => !!dataId.value)

// 页面标题
const pageTitle = computed(() => {
  const tableName = tableConfig.value?.info?.tableName || ''
  if (isViewMode.value) return `${tableName} - 查看数据`
  if (isEditMode.value) return `${tableName} - 编辑数据`
  return `${tableName} - 新增数据`
})

// 加载表配置
const loadTableConfig = async () => {
  if (!tableId.value) {
    ElMessage.error('缺少表ID参数')
    router.push('/table/list')
    return
  }

  loading.value = true
  try {
    const data = await getTableDetail(tableId.value)
    if (data) {
      tableConfig.value = data
      // 如果是编辑模式，加载数据
      if (isEditMode.value) {
        await loadDataDetail()
      }
    } else {
      ElMessage.error('表配置不存在')
      router.push('/table/list')
    }
  } catch (error) {
    ElMessage.error('加载表配置失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载数据详情
const loadDataDetail = async () => {
  if (!dataId.value) return

  try {
    const data = await getDataDetail(dataId.value)
    if (data) {
      formData.value = { ...data.data }
    } else {
      ElMessage.error('数据不存在')
      router.push(`/table/data/list?tableId=${tableId.value}`)
    }
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  }
}

// 保存数据
const handleSave = async () => {
  if (isViewMode.value) return

  // 校验表单
  if (dynamicFormRef.value) {
    const valid = await dynamicFormRef.value.validate()
    if (!valid) {
      return
    }
  }

  saving.value = true
  try {
    const record = {
      id: dataId.value || '',
      tableId: tableId.value,
      data: { ...formData.value },
      createTime: '',
      updateTime: ''
    }

    const result = await saveData(record)
    if (result.success) {
      ElMessage.success(result.message)
      router.push(`/table/data/list?tableId=${tableId.value}`)
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

// 返回
const handleBack = () => {
  router.push(`/table/data/list?tableId=${tableId.value}`)
}

onMounted(() => {
  loadTableConfig()
})
</script>

<template>
  <div class="data-edit-page">
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
            <el-button type="primary" :loading="saving" @click="handleSave">
              保存
            </el-button>
          </div>
        </div>
      </template>

      <el-empty
        v-if="!tableConfig || tableConfig.fields.length === 0"
        description="该表尚未配置字段，请先配置字段"
      />

      <template v-else>
        <DynamicForm
          ref="dynamicFormRef"
          :fields="tableConfig.fields"
          v-model="formData"
          :disabled="isViewMode"
          :readonly="isViewMode"
          :mode="isViewMode ? 'detail' : 'form'"
        />
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.data-edit-page {
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
</style>
