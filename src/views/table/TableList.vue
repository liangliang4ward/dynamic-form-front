<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTableList, deleteTable } from '@/api/tableMock'
import { DataAnalysis } from '@element-plus/icons-vue'

const router = useRouter()

const searchKeyword = ref('')

const tableList = ref([])
const loading = ref(false)
const total = ref(0)

const tableTypeMap = computed(() => ({
  single: { label: '单表', type: 'info' },
  main: { label: '主表', type: 'primary' },
  slave: { label: '附表', type: 'warning' }
}))

const loadData = async () => {
  loading.value = true
  try {
    const result = await getTableList({ keyword: searchKeyword.value })
    tableList.value = result.list
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

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

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="table-list-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>表配置列表</span>
          <el-button type="primary" @click="handleCreate"> 新建表配置 </el-button>
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

      <el-table
        v-loading="loading"
        :data="tableList"
        border
        stripe
        style="width: 100%"
        empty-text="暂无数据"
      >
        <el-table-column prop="info.tableName" label="表名称" min-width="150" />
        <el-table-column prop="info.tableCode" label="表编码" min-width="150" />
        <el-table-column
          prop="info.tableDesc"
          label="表描述"
          min-width="200"
          show-overflow-tooltip
        />
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
        <el-table-column prop="updateTime" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="success"
              link
              :icon="DataAnalysis"
              @click="handleDataManage(row)"
              title="数据管理"
            >
              数据
            </el-button>
            <el-button type="primary" link @click="handleView(row)"> 查看 </el-button>
            <el-button type="primary" link @click="handleEdit(row)"> 编辑 </el-button>
            <el-button type="danger" link @click="handleDelete(row)"> 删除 </el-button>
          </template>
        </el-table-column>
      </el-table>

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

.search-form {
  margin-bottom: 20px;
}

.pagination-wrapper {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
