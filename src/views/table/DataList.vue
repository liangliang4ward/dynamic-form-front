<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, Edit, Delete, View, MagicStick, Refresh, Search } from '@element-plus/icons-vue'
import { getTableDetail, getDataList, deleteData, generateMockData } from '@/api/tableMock'
import AdvancedQueryDialog from '@/components/table/AdvancedQueryDialog.vue'

const router = useRouter()
const route = useRoute()

// 表配置
const tableConfig = ref(null)
const loading = ref(false)
const generating = ref(false)

// 数据列表
const dataList = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 查询条件
const searchConditions = ref({})

// 高级查询
const advancedQueryDialogVisible = ref(false)
const currentAdvancedConditions = ref(null)

// 获取表ID
const tableId = computed(() => route.query.tableId)

// 页面标题
const pageTitle = computed(() => {
  return tableConfig.value?.info?.tableName || '数据列表'
})

// 获取启用的查询字段
const enabledQueryFields = computed(() => {
  if (!tableConfig.value) return []
  
  return tableConfig.value.queryFields
    .filter(qf => qf.enabled)
    .sort((a, b) => a.sort - b.sort)
    .map(qf => {
      const field = tableConfig.value.fields.find(f => f.id === qf.fieldId)
      return {
        ...qf,
        field
      }
    })
    .filter(item => item.field)
})

// 获取列表显示字段
const listDisplayFields = computed(() => {
  if (!tableConfig.value) return []
  
  return tableConfig.value.fields
    .filter(f => {
      const displayConfig = f.displayConfig
      if (!displayConfig) return true
      return displayConfig.showInList && !displayConfig.hidden
    })
    .sort((a, b) => {
      const sortA = a.displayConfig?.listSort ?? a.sort
      const sortB = b.displayConfig?.listSort ?? b.sort
      return sortA - sortB
    })
})

// 获取查询类型标签
const getQueryTypeLabel = (type) => {
  const labels = {
    equal: '等于',
    like: '模糊匹配',
    range: '范围',
    in: '包含',
    greater: '大于',
    less: '小于',
    greaterEqual: '大于等于',
    lessEqual: '小于等于'
  }
  return labels[type] || type
}

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
      // 加载数据
      loadDataList()
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

// 加载数据列表
const loadDataList = async () => {
  if (!tableId.value) return

  loading.value = true
  try {
    const result = await getDataList({
      tableId: tableId.value,
      page: page.value,
      pageSize: pageSize.value,
      conditions: searchConditions.value
    })
    dataList.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  page.value = 1
  loadDataList()
}

// 重置搜索
const handleReset = () => {
  searchConditions.value = {}
  currentAdvancedConditions.value = null
  page.value = 1
  loadDataList()
}

// 打开高级查询
const openAdvancedQuery = () => {
  advancedQueryDialogVisible.value = true
}

// 执行高级查询
const handleAdvancedQuery = (conditionGroup) => {
  currentAdvancedConditions.value = conditionGroup
  // 转换高级查询条件为简单查询条件（临时实现，后续可以在API中完善）
  // 这里先提取第一层条件
  const conditions = {}
  if (conditionGroup && conditionGroup.conditions) {
    conditionGroup.conditions.forEach(c => {
      if (c.enabled && c.fieldCode && c.value) {
        conditions[c.fieldCode] = c.value
      }
    })
  }
  searchConditions.value = conditions
  page.value = 1
  loadDataList()
  ElMessage.success('查询完成')
}

// 刷新
const handleRefresh = () => {
  loadDataList()
}

// 新增数据
const handleAdd = () => {
  router.push(`/table/data/edit?tableId=${tableId.value}`)
}

// 生成Mock数据
const handleGenerateMockData = async () => {
  if (!tableConfig.value) {
    ElMessage.warning('表配置不存在')
    return
  }

  if (!tableConfig.value.fields || tableConfig.value.fields.length === 0) {
    ElMessage.warning('该表尚未配置字段，请先配置字段')
    return
  }

  try {
    const { value: count } = await ElMessageBox.prompt('请输入要生成的数据条数', '生成Mock数据', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /^\d+$/,
      inputErrorMessage: '请输入有效的数字',
      inputValue: '20'
    })

    const numCount = parseInt(count)
    if (numCount <= 0 || numCount > 1000) {
      ElMessage.warning('请输入1-1000之间的数字')
      return
    }

    generating.value = true
    const result = await generateMockData(tableId.value, numCount, tableConfig.value)
    
    if (result.success) {
      ElMessage.success(result.message)
      loadDataList()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消
  } finally {
    generating.value = false
  }
}

// 查看数据
const handleView = (row) => {
  router.push(`/table/data/edit?tableId=${tableId.value}&id=${row.id}&view=true`)
}

// 编辑数据
const handleEdit = (row) => {
  router.push(`/table/data/edit?tableId=${tableId.value}&id=${row.id}`)
}

// 删除数据
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这条数据吗？此操作不可恢复。',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await deleteData(row.id)
    if (result.success) {
      ElMessage.success(result.message)
      loadDataList()
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消
  }
}

// 格式化时间
const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 获取单元格值
const getCellValue = (row, field) => {
  const value = row.data?.[field.fieldCode]
  if (value === undefined || value === null || value === '') {
    return '-'
  }
  return String(value)
}

// 返回
const handleBack = () => {
  router.push('/table/list')
}

// 分页变化
const handlePageChange = (newPage) => {
  page.value = newPage
  loadDataList()
}

const handlePageSizeChange = (newSize) => {
  pageSize.value = newSize
  page.value = 1
  loadDataList()
}

onMounted(() => {
  loadTableConfig()
})
</script>

<template>
  <div class="data-list-page">
    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-button type="primary" link @click="handleBack">
              <el-icon><ArrowLeft /></el-icon>
              返回
            </el-button>
            <span class="title">{{ pageTitle }} - 数据列表</span>
            <el-tag v-if="total > 0" type="info" size="large">
              共 {{ total }} 条数据
            </el-tag>
          </div>
          <div class="header-right">
            <el-button :icon="Refresh" @click="handleRefresh" :disabled="loading">
              刷新
            </el-button>
            <el-button
              type="warning"
              :icon="MagicStick"
              @click="handleGenerateMockData"
              :loading="generating"
            >
              生成Mock数据
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleAdd">
              新增数据
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索区域 -->
      <el-form
        v-if="enabledQueryFields.length > 0"
        :inline="true"
        class="search-form"
      >
        <el-form-item
          v-for="queryField in enabledQueryFields"
          :key="queryField.id"
          :label="queryField.field?.fieldName"
        >
          <el-input
            v-model="searchConditions[queryField.field!.fieldCode]"
            :placeholder="`请输入${getQueryTypeLabel(queryField.queryType)}`"
            clearable
            @keyup.enter="handleSearch"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
          <el-button type="success" :icon="Search" @click="openAdvancedQuery">
            高级查询
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 高级查询条件提示 -->
      <el-alert
        v-if="currentAdvancedConditions"
        type="success"
        :closable="false"
        show-icon
        style="margin-bottom: 16px"
      >
        <template #title>
          已应用高级查询条件
          <el-button type="primary" link size="small" @click="openAdvancedQuery">
            查看/修改条件
          </el-button>
          <el-button type="info" link size="small" @click="handleReset">
            清除条件
          </el-button>
        </template>
      </el-alert>

      <!-- 空数据提示 -->
      <el-empty
        v-if="dataList.length === 0 && !loading"
        description="暂无数据"
        class="empty-data"
      >
        <el-button type="primary" :icon="MagicStick" @click="handleGenerateMockData">
          生成Mock数据
        </el-button>
      </el-empty>

      <!-- 数据表格 -->
      <template v-else>
        <el-table
          :data="dataList"
          border
          stripe
          style="width: 100%"
          empty-text="暂无数据"
        >
          <el-table-column
            v-for="field in listDisplayFields"
            :key="field.id"
            :prop="`data.${field.fieldCode}`"
            :label="field.fieldName"
            :min-width="field.displayConfig?.listWidth || 120"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ getCellValue(row, field) }}
            </template>
          </el-table-column>

          <el-table-column label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column label="更新时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.updateTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <el-button
                type="primary"
                link
                size="small"
                :icon="View"
                @click="handleView(row)"
              >
                查看
              </el-button>
              <el-button
                type="primary"
                link
                size="small"
                :icon="Edit"
                @click="handleEdit(row)"
              >
                编辑
              </el-button>
              <el-button
                type="danger"
                link
                size="small"
                :icon="Delete"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </template>
    </el-card>

    <!-- 高级查询对话框 -->
    <AdvancedQueryDialog
      v-model="advancedQueryDialogVisible"
      :tableId="tableId"
      :fields="tableConfig?.fields || []"
      :currentConditionGroup="currentAdvancedConditions"
      @query="handleAdvancedQuery"
    />
  </div>
</template>

<style scoped>
.data-list-page {
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

.search-form {
  margin-bottom: 20px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.empty-data {
  padding: 40px 0;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
