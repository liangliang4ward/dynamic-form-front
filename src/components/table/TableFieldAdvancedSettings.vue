<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

// 当前激活的标签页
const activeTab = ref('dataSource')

// 数据来源类型选项
const dataSourceTypeOptions = [
  { label: '用户输入', value: 'userInput', desc: '用户在表单中手动输入', icon: 'Edit' },
  { label: '登录信息', value: 'loginInfo', desc: '从当前登录用户信息中获取', icon: 'User' },
  { label: '系统默认', value: 'systemDefault', desc: '使用系统默认值', icon: 'Setting' },
  { label: '字典', value: 'dict', desc: '从数据字典中获取选项', icon: 'Collection' },
  { label: '自定义', value: 'custom', desc: '使用自定义表达式或值', icon: 'MagicStick' }
]

// 登录信息字段选项
const loginInfoFieldOptions = [
  { label: '用户ID', value: 'userId' },
  { label: '用户名', value: 'userName' },
  { label: '部门ID', value: 'deptId' },
  { label: '部门名称', value: 'deptName' },
  { label: '角色ID', value: 'roleId' },
  { label: '角色名称', value: 'roleName' },
  { label: '租户ID', value: 'tenantId' },
  { label: '组织ID', value: 'orgId' }
]

// 查询类型选项
const queryTypeOptions = [
  { label: '等于', value: 'equal', desc: '精确匹配' },
  { label: '模糊匹配', value: 'like', desc: '包含关键字' },
  { label: '范围查询', value: 'range', desc: '区间范围' },
  { label: '大于', value: 'greater', desc: '大于指定值' },
  { label: '小于', value: 'less', desc: '小于指定值' },
  { label: '大于等于', value: 'greaterEqual', desc: '大于或等于' },
  { label: '小于等于', value: 'lessEqual', desc: '小于或等于' }
]

// 当前编辑的字段副本
const localField = ref({ ...props.modelValue })

// 监听外部值变化
watch(
  () => props.modelValue,
  (newVal) => {
    localField.value = { ...newVal }
  },
  { deep: true }
)

// 确保 dataSource 存在
const ensureDataSource = () => {
  if (!localField.value.dataSource) {
    localField.value.dataSource = {
      type: 'userInput'
    }
  }
}

// 确保 displayConfig 存在
const ensureDisplayConfig = () => {
  if (!localField.value.displayConfig) {
    localField.value.displayConfig = {
      showInList: true,
      showInForm: true,
      showInDetail: true,
      listSort: localField.value.sort,
      formSort: localField.value.sort,
      readonly: false,
      hidden: false
    }
  }
}

// 确保 queryConfig 存在
const ensureQueryConfig = () => {
  if (!localField.value.queryConfig) {
    localField.value.queryConfig = {
      enabled: false,
      queryType: 'equal',
      sort: localField.value.sort
    }
  }
}

// 数据来源类型
const dataSourceType = computed({
  get: () => {
    ensureDataSource()
    return localField.value.dataSource.type
  },
  set: (val) => {
    ensureDataSource()
    localField.value.dataSource.type = val
    // 重置其他字段
    localField.value.dataSource.loginInfoField = undefined
    localField.value.dataSource.dictCode = undefined
    localField.value.dataSource.customValue = undefined
    localField.value.dataSource.expression = undefined
    updateField()
  }
})

// 登录信息字段
const loginInfoField = computed({
  get: () => {
    ensureDataSource()
    return localField.value.dataSource.loginInfoField
  },
  set: (val) => {
    ensureDataSource()
    localField.value.dataSource.loginInfoField = val
    updateField()
  }
})

// 字典编码
const dictCode = computed({
  get: () => {
    ensureDataSource()
    return localField.value.dataSource.dictCode
  },
  set: (val) => {
    ensureDataSource()
    localField.value.dataSource.dictCode = val
    updateField()
  }
})

// 自定义值
const customValue = computed({
  get: () => {
    ensureDataSource()
    return localField.value.dataSource.customValue
  },
  set: (val) => {
    ensureDataSource()
    localField.value.dataSource.customValue = val
    updateField()
  }
})

// 显示配置 - 列表显示
const showInList = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig.showInList
  },
  set: (val) => {
    ensureDisplayConfig()
    localField.value.displayConfig.showInList = val
    updateField()
  }
})

// 显示配置 - 表单显示
const showInForm = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig.showInForm
  },
  set: (val) => {
    ensureDisplayConfig()
    localField.value.displayConfig.showInForm = val
    updateField()
  }
})

// 显示配置 - 详情显示
const showInDetail = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig.showInDetail
  },
  set: (val) => {
    ensureDisplayConfig()
    localField.value.displayConfig.showInDetail = val
    updateField()
  }
})

// 显示配置 - 列表宽度
const listWidth = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig.listWidth
  },
  set: (val) => {
    ensureDisplayConfig()
    localField.value.displayConfig.listWidth = val
    updateField()
  }
})

// 显示配置 - 列表排序
const listSort = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig.listSort
  },
  set: (val) => {
    ensureDisplayConfig()
    localField.value.displayConfig.listSort = val
    updateField()
  }
})

// 显示配置 - 表单排序
const formSort = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig.formSort
  },
  set: (val) => {
    ensureDisplayConfig()
    localField.value.displayConfig.formSort = val
    updateField()
  }
})

// 显示配置 - 只读
const readonly = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig.readonly
  },
  set: (val) => {
    ensureDisplayConfig()
    localField.value.displayConfig.readonly = val
    updateField()
  }
})

// 显示配置 - 隐藏
const hidden = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig.hidden
  },
  set: (val) => {
    ensureDisplayConfig()
    localField.value.displayConfig.hidden = val
    updateField()
  }
})

// 显示配置 - 占位符
const placeholder = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig.placeholder
  },
  set: (val) => {
    ensureDisplayConfig()
    localField.value.displayConfig.placeholder = val
    updateField()
  }
})

// 查询配置 - 启用查询
const queryEnabled = computed({
  get: () => {
    ensureQueryConfig()
    return localField.value.queryConfig.enabled
  },
  set: (val) => {
    ensureQueryConfig()
    localField.value.queryConfig.enabled = val
    updateField()
  }
})

// 查询配置 - 查询类型
const queryType = computed({
  get: () => {
    ensureQueryConfig()
    return localField.value.queryConfig.queryType
  },
  set: (val) => {
    ensureQueryConfig()
    localField.value.queryConfig.queryType = val
    updateField()
  }
})

// 查询配置 - 排序
const querySort = computed({
  get: () => {
    ensureQueryConfig()
    return localField.value.queryConfig.sort
  },
  set: (val) => {
    ensureQueryConfig()
    localField.value.queryConfig.sort = val
    updateField()
  }
})

// 更新字段
const updateField = () => {
  emit('update:modelValue', { ...localField.value })
}

// 获取数据来源描述
const getDataSourceDesc = (type) => {
  const option = dataSourceTypeOptions.find(o => o.value === type)
  return option?.desc || ''
}

// 获取查询类型描述
const getQueryTypeDesc = (type) => {
  const option = queryTypeOptions.find(o => o.value === type)
  return option?.desc || ''
}
</script>

<template>
  <div class="field-advanced-settings">
    <!-- 标签页导航 -->
    <div class="tabs-nav">
      <div
        class="tab-item"
        :class="{ active: activeTab === 'dataSource' }"
        @click="activeTab = 'dataSource'"
      >
        <span class="tab-icon">📊</span>
        <span class="tab-label">数据来源</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'display' }"
        @click="activeTab = 'display'"
      >
        <span class="tab-icon">👁️</span>
        <span class="tab-label">显示设置</span>
      </div>
      <div
        class="tab-item"
        :class="{ active: activeTab === 'query' }"
        @click="activeTab = 'query'"
      >
        <span class="tab-icon">🔍</span>
        <span class="tab-label">查询配置</span>
      </div>
    </div>

    <!-- 数据来源配置 -->
    <div v-show="activeTab === 'dataSource'" class="tab-content">
      <div class="config-card">
        <div class="card-header">
          <span class="card-title">选择数据来源类型</span>
          <span class="card-desc">配置该字段的数据获取方式</span>
        </div>
        <div class="data-source-options">
          <div
            v-for="option in dataSourceTypeOptions"
            :key="option.value"
            class="source-option"
            :class="{ active: dataSourceType === option.value }"
            @click="dataSourceType = option.value"
          >
            <div class="option-icon">
              <span v-if="option.value === 'userInput'">✏️</span>
              <span v-else-if="option.value === 'loginInfo'">👤</span>
              <span v-else-if="option.value === 'systemDefault'">⚙️</span>
              <span v-else-if="option.value === 'dict'">📚</span>
              <span v-else-if="option.value === 'custom'">✨</span>
            </div>
            <div class="option-info">
              <div class="option-label">{{ option.label }}</div>
              <div class="option-desc">{{ option.desc }}</div>
            </div>
            <div class="option-check" v-if="dataSourceType === option.value">
              ✓
            </div>
          </div>
        </div>
      </div>

      <!-- 登录信息字段选择 -->
      <div v-if="dataSourceType === 'loginInfo'" class="config-card">
        <div class="card-header">
          <span class="card-title">选择登录信息字段</span>
        </div>
        <el-select
          v-model="loginInfoField"
          placeholder="请选择登录信息字段"
          style="width: 100%"
          :disabled="disabled"
          clearable
          size="large"
        >
          <el-option
            v-for="option in loginInfoFieldOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <div class="tip-text">选择从登录信息中获取哪个字段的值，表单将自动填充</div>
      </div>

      <!-- 字典编码 -->
      <div v-if="dataSourceType === 'dict'" class="config-card">
        <div class="card-header">
          <span class="card-title">配置字典编码</span>
        </div>
        <el-input
          v-model="dictCode"
          placeholder="请输入字典编码，如：user_status, gender"
          style="width: 100%"
          :disabled="disabled"
          clearable
          size="large"
        />
        <div class="tip-text">输入数据字典的编码，用于获取下拉选项列表</div>
      </div>

      <!-- 自定义值 -->
      <div v-if="dataSourceType === 'custom'" class="config-card">
        <div class="card-header">
          <span class="card-title">配置自定义值</span>
        </div>
        <el-input
          v-model="customValue"
          placeholder="请输入自定义值或表达式"
          style="width: 100%"
          :disabled="disabled"
          clearable
          type="textarea"
          :rows="3"
        />
        <div class="tip-text">输入自定义的默认值或表达式，表单将使用此值作为默认值</div>
      </div>
    </div>

    <!-- 显示设置 -->
    <div v-show="activeTab === 'display'" class="tab-content">
      <!-- 显示控制 -->
      <div class="config-card">
        <div class="card-header">
          <span class="card-title">显示控制</span>
          <span class="card-desc">配置字段在不同场景下的显示状态</span>
        </div>
        <div class="display-options">
          <div class="display-option">
            <el-checkbox v-model="showInList" :disabled="disabled">
              <span class="option-main">列表显示</span>
              <span class="option-sub">在数据列表页面显示该列</span>
            </el-checkbox>
          </div>
          <div class="display-option">
            <el-checkbox v-model="showInForm" :disabled="disabled">
              <span class="option-main">表单显示</span>
              <span class="option-sub">在新增/编辑表单中显示该字段</span>
            </el-checkbox>
          </div>
          <div class="display-option">
            <el-checkbox v-model="showInDetail" :disabled="disabled">
              <span class="option-main">详情显示</span>
              <span class="option-sub">在查看详情页面显示该字段</span>
            </el-checkbox>
          </div>
        </div>
      </div>

      <!-- 排序配置 -->
      <div class="config-card">
        <div class="card-header">
          <span class="card-title">排序配置</span>
          <span class="card-desc">配置字段在列表和表单中的显示顺序</span>
        </div>
        <el-row :gutter="20">
          <el-col :span="8">
            <div class="form-item-label">列表排序</div>
            <el-input-number
              v-model="listSort"
              :min="0"
              :disabled="disabled"
              controls-position="right"
              style="width: 100%"
              size="large"
            />
            <div class="tip-text">数值越小越靠前</div>
          </el-col>
          <el-col :span="8">
            <div class="form-item-label">表单排序</div>
            <el-input-number
              v-model="formSort"
              :min="0"
              :disabled="disabled"
              controls-position="right"
              style="width: 100%"
              size="large"
            />
            <div class="tip-text">数值越小越靠前</div>
          </el-col>
          <el-col :span="8">
            <div class="form-item-label">列表宽度</div>
            <el-input-number
              v-model="listWidth"
              :min="50"
              :max="1000"
              :disabled="disabled"
              placeholder="像素"
              controls-position="right"
              style="width: 100%"
              size="large"
            />
            <div class="tip-text">列表中该列的宽度（像素）</div>
          </el-col>
        </el-row>
      </div>

      <!-- 其他属性 -->
      <div class="config-card">
        <div class="card-header">
          <span class="card-title">其他属性</span>
        </div>
        <div class="display-options">
          <div class="display-option">
            <el-checkbox v-model="readonly" :disabled="disabled">
              <span class="option-main">只读</span>
              <span class="option-sub">表单中显示但不可编辑</span>
            </el-checkbox>
          </div>
          <div class="display-option">
            <el-checkbox v-model="hidden" :disabled="disabled">
              <span class="option-main">隐藏</span>
              <span class="option-sub">不显示但数据仍保存</span>
            </el-checkbox>
          </div>
        </div>
      </div>

      <!-- 占位符 -->
      <div class="config-card">
        <div class="card-header">
          <span class="card-title">表单占位符</span>
        </div>
        <el-input
          v-model="placeholder"
          placeholder="请输入表单占位符文本，如：请输入用户名"
          style="width: 100%"
          :disabled="disabled"
          clearable
          size="large"
        />
        <div class="tip-text">表单输入框的占位提示文本</div>
      </div>
    </div>

    <!-- 查询配置 -->
    <div v-show="activeTab === 'query'" class="tab-content">
      <div class="config-card">
        <div class="card-header">
          <span class="card-title">启用查询</span>
          <span class="card-desc">开启后该字段将作为查询条件显示在搜索区域</span>
        </div>
        <div class="query-enable-section">
          <div class="enable-switch">
            <span class="switch-label">启用查询</span>
            <el-switch
              v-model="queryEnabled"
              :disabled="disabled"
              active-text="已启用"
              inactive-text="未启用"
              active-color="#409EFF"
            />
          </div>
          <div class="enable-desc" v-if="queryEnabled">
            <el-tag type="success" size="large">该字段将显示在数据列表的搜索区域</el-tag>
          </div>
          <div class="enable-desc" v-else>
            <el-tag type="info" size="large">该字段不会作为查询条件</el-tag>
          </div>
        </div>
      </div>

      <div v-if="queryEnabled" class="config-card">
        <div class="card-header">
          <span class="card-title">查询类型</span>
          <span class="card-desc">选择该字段的查询匹配方式</span>
        </div>
        <div class="query-type-options">
          <div
            v-for="option in queryTypeOptions"
            :key="option.value"
            class="query-type-option"
            :class="{ active: queryType === option.value }"
            @click="queryType = option.value"
          >
            <div class="query-type-label">{{ option.label }}</div>
            <div class="query-type-desc">{{ option.desc }}</div>
            <div class="query-type-check" v-if="queryType === option.value">✓</div>
          </div>
        </div>
      </div>

      <div v-if="queryEnabled" class="config-card">
        <div class="card-header">
          <span class="card-title">查询排序</span>
          <span class="card-desc">配置查询条件在搜索区域的显示顺序</span>
        </div>
        <el-input-number
          v-model="querySort"
          :min="0"
          :disabled="disabled"
          controls-position="right"
          style="width: 200px"
          size="large"
        />
        <div class="tip-text">数值越小，在搜索区域显示越靠前</div>
      </div>

      <div class="config-card info-card">
        <div class="info-icon">💡</div>
        <div class="info-content">
          <div class="info-title">查询配置说明</div>
          <div class="info-text">
            <ul>
              <li><strong>等于</strong>：精确匹配查询，适用于编码、ID等精确值</li>
              <li><strong>模糊匹配</strong>：包含关键字查询，适用于名称、描述等文本字段</li>
              <li><strong>大于/小于</strong>：范围查询，适用于数值、日期等可比较字段</li>
              <li><strong>范围查询</strong>：区间查询，适用于日期范围、数值范围</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.field-advanced-settings {
  padding: 0;
}

/* 标签页导航 */
.tabs-nav {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  padding: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
  border-radius: 12px;
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fff;
  border: 2px solid transparent;
}

.tab-item:hover {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.tab-item.active {
  background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.tab-icon {
  font-size: 20px;
}

.tab-label {
  font-weight: 600;
  font-size: 14px;
}

/* 标签页内容 */
.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 配置卡片 */
.config-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  border: 1px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.card-desc {
  font-size: 12px;
  color: #909399;
}

/* 数据来源选项 */
.data-source-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.source-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  border: 2px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.source-option:hover {
  border-color: #c0c4cc;
  background: #f5f7fa;
}

.source-option.active {
  border-color: #409EFF;
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.15);
}

.option-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-radius: 10px;
  font-size: 22px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.option-info {
  flex: 1;
}

.option-label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.option-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.option-check {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409EFF;
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
}

/* 显示选项 */
.display-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.display-option {
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
  border: 1px solid #ebeef5;
}

.display-option :deep(.el-checkbox__label) {
  width: 100%;
}

.option-main {
  display: block;
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.option-sub {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 表单标签 */
.form-item-label {
  font-size: 13px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

/* 提示文本 */
.tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

/* 查询启用区域 */
.query-enable-section {
  text-align: center;
  padding: 20px;
}

.enable-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.switch-label {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.enable-desc {
  margin-top: 12px;
}

/* 查询类型选项 */
.query-type-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.query-type-option {
  position: relative;
  padding: 16px;
  border-radius: 10px;
  border: 2px solid #ebeef5;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
  text-align: center;
}

.query-type-option:hover {
  border-color: #c0c4cc;
  background: #f5f7fa;
}

.query-type-option.active {
  border-color: #409EFF;
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
}

.query-type-label {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.query-type-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.query-type-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409EFF;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
}

/* 信息卡片 */
.info-card {
  background: linear-gradient(135deg, #fdf6ec 0%, #faecd8 100%);
  border-color: #e6a23c;
}

.info-card .info-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.info-card .info-title {
  font-size: 15px;
  font-weight: 600;
  color: #e6a23c;
  margin-bottom: 12px;
}

.info-card .info-text {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}

.info-card .info-text ul {
  margin: 0;
  padding-left: 20px;
}

.info-card .info-text li {
  margin-bottom: 4px;
}
</style>
