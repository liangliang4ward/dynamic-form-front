<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, Edit, Delete, View } from '@element-plus/icons-vue'
import { getTableDetail, getDataList, deleteData } from '@/api/tableMock'
import { TableConfig, TableField, QueryField, QueryType } from '@/types/tableTypes'

const router = useRouter()
const route = useRoute()

// 表配置
const tableConfig = ref<TableConfig | null>(null)
const loading = ref(false)

// 数据列表
const dataList = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

// 查询条件
const searchConditions = ref<Record<string, any>>({})

// 获取表ID
const tableId = computed(() => route.query.tableId as string)

// 页面标题
const pageTitle = computed(() => {
  return tableConfig.value?.info.tableName || '数据列表'
})

// 获取启用的查询字段
const enabledQueryFields = computed(() => {
  if (!tableConfig.value) return []
  
  return tableConfig.value.queryFields
    .filter(qf => qf.enabled)
    .sort((a, b) => a.sort - b.sort)
    .map(qf => {
      const field = tableConfig.value!.fields.find(f => f.id === qf.fieldId)
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
const getQueryTypeLabel = (type: QueryType) => {
  const labels: Record<QueryType, string> = {
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
  page.value = 1
  loadDataList()
}

// 新增数据
const handleAdd = () => {
  router.push(`/table/data/edit?tableId=${tableId.value}`)
}

// 查看数据
const handleView = (row: any) => {
  router.push(`/table/data/edit?tableId=${tableId.value}&id=${row.id}&view=true`)
}

// 编辑数据
const handleEdit = (row: any) => {
  router.push(`/table/data/edit?tableId=${tableId.value}&id=${row.id}`)
}

// 删除数据
const handleDelete = async (row: any) => {
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
const formatTime = (time: string) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 获取单元格值
const getCellValue = (row: any, field: TableField) => {
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
const handlePageChange = (newPage: number) => {
  page.value = newPage
  loadDataList()
}

const handlePageSizeChange = (newSize: number) => {
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
          </div>
          <div class="header-right">
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
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
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
    </el-card>
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

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
