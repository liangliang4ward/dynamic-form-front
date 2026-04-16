<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTableList, deleteTable, generateMockData } from '@/api/tableMock'
import { getDataRecordsByTableId } from '@/utils/tableStorage'
import { DataAnalysis, Plus, MagicStick, View, Edit, Delete, Refresh } from '@element-plus/icons-vue'

const router = useRouter()

const searchKeyword = ref('')

const tableList = ref([])
const loading = ref(false)
const generating = ref(false)
const total = ref(0)

// 存储每个表的数据条数
const tableDataCounts = ref({})

const tableTypeMap = computed(() => ({
  single: { label: '单表', type: 'info' },
  main: { label: '主表', type: 'primary' },
  slave: { label: '附表', type: 'warning' }
}))

// 加载数据条数
const loadDataCounts = () => {
  tableDataCounts.value = {}
  tableList.value.forEach(table => {
    const records = getDataRecordsByTableId(table.id)
    tableDataCounts.value[table.id] = records.length
  })
}

const loadData = async () => {
  loading.value = true
  try {
    const result = await getTableList({ keyword: searchKeyword.value })
    tableList.value = result.list
    total.value = result.total
    // 加载数据条数
    loadDataCounts()
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 监听表列表变化，更新数据条数
watch(
  () => tableList.value,
  () => {
    loadDataCounts()
  },
  { deep: true }
)

const handleSearch = () => {
  loadData()
}

const handleReset = () => {
  searchKeyword.value = ''
  loadData()
}

const handleCreate = () => {
  router.push('/table/edit')
}

const handleView = row => {
  router.push(`/table/edit?id=${row.id}&view=true`)
}

const handleEdit = row => {
  router.push(`/table/edit?id=${row.id}`)
}

// 数据管理
const handleDataManage = row => {
  router.push(`/table/data/list?tableId=${row.id}`)
}

// 生成Mock数据
const handleGenerateMockData = async row => {
  if (!row.fields || row.fields.length === 0) {
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
    const result = await generateMockData(row.id, numCount, row)
    
    if (result.success) {
      ElMessage.success(result.message)
      // 刷新数据条数
      loadDataCounts()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 用户取消
  } finally {
    generating.value = false
  }
}

const handleDelete = async row => {
  try {
    await ElMessageBox.confirm(
      `确定要删除表配置"${row.info.tableName}"吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const result = await deleteTable(row.id)
    if (result.success) {
      ElMessage.success(result.message)
      loadData()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
    }
  }
}

const formatTime = time => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

// 获取数据条数
const getDataCount = tableId => {
  return tableDataCounts.value[tableId] || 0
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="table-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span class="title">表配置列表</span>
            <el-tag v-if="tableList.length > 0" type="info">
              共 {{ tableList.length }} 个表
            </el-tag>
          </div>
          <div class="header-right">
            <el-button :icon="Refresh" @click="loadData" :disabled="loading">
              刷新
            </el-button>
            <el-button type="primary" :icon="Plus" @click="handleCreate">
              新建表配置
            </el-button>
          </div>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="表编码/名称">
          <el-input
            v-model="searchKeyword"
            placeholder="请输入表编码或名称"
            clearable
            @keyup.enter="handleSearch"
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 空数据提示 -->
      <el-empty
        v-if="tableList.length === 0 && !loading"
        description="暂无表配置"
        class="empty-data"
      >
        <el-button type="primary" :icon="Plus" @click="handleCreate">
          新建表配置
        </el-button>
      </el-empty>

      <!-- 数据表格 -->
      <template v-else>
        <el-table
          v-loading="loading"
          :data="tableList"
          border
          stripe
          style="width: 100%"
          empty-text="暂无数据"
          :row-class-name="tableRowClassName"
        >
          <el-table-column type="index" label="序号" width="60" align="center" />

          <el-table-column prop="info.tableName" label="表名称" min-width="150">
            <template #default="{ row }">
              <div class="table-name-cell">
                <span class="table-name">{{ row.info.tableName }}</span>
                <el-tag v-if="getDataCount(row.id) > 0" type="success" size="small" effect="light">
                  {{ getDataCount(row.id) }} 条数据
                </el-tag>
                <el-tag v-else type="info" size="small" effect="light">
                  无数据
                </el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column prop="info.tableCode" label="表编码" min-width="150">
            <template #default="{ row }">
              <code class="table-code">{{ row.info.tableCode }}</code>
            </template>
          </el-table-column>

          <el-table-column
            prop="info.tableDesc"
            label="表描述"
            min-width="180"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span v-if="row.info.tableDesc">{{ row.info.tableDesc }}</span>
              <span v-else class="text-muted">暂无描述</span>
            </template>
          </el-table-column>

          <el-table-column label="字段数" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.fields?.length > 0 ? 'primary' : 'info'" size="small">
                {{ row.fields?.length || 0 }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="info.tableType" label="表类型" width="100">
            <template #default="{ row }">
              <el-tag :type="tableTypeMap[row.info.tableType]?.type || 'info'">
                {{ tableTypeMap[row.info.tableType]?.label || row.info.tableType }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createTime) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="320" fixed="right" align="center">
            <template #default="{ row }">
              <el-tooltip content="生成Mock数据" placement="top">
                <el-button
                  type="warning"
                  link
                  size="small"
                  :icon="MagicStick"
                  @click="handleGenerateMockData(row)"
                  :loading="generating"
                >
                  生成数据
                </el-button>
              </el-tooltip>
              <el-tooltip content="数据管理" placement="top">
                <el-button
                  type="success"
                  link
                  size="small"
                  :icon="DataAnalysis"
                  @click="handleDataManage(row)"
                >
                  数据
                </el-button>
              </el-tooltip>
              <el-tooltip content="查看配置" placement="top">
                <el-button
                  type="primary"
                  link
                  size="small"
                  :icon="View"
                  @click="handleView(row)"
                >
                  查看
                </el-button>
              </el-tooltip>
              <el-tooltip content="编辑配置" placement="top">
                <el-button
                  type="primary"
                  link
                  size="small"
                  :icon="Edit"
                  @click="handleEdit(row)"
                >
                  编辑
                </el-button>
              </el-tooltip>
              <el-tooltip content="删除配置" placement="top">
                <el-button
                  type="danger"
                  link
                  size="small"
                  :icon="Delete"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            :current-page="1"
            :page-size="10"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="loadData"
            @current-change="loadData"
          />
        </div>
      </template>
    </el-card>
  </div>
</template>

<style scoped>
.table-list-page {
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

.table-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.table-name {
  font-weight: 500;
  color: #303133;
}

.table-code {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #409EFF;
  background: #ecf5ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa !important;
}
</style>
