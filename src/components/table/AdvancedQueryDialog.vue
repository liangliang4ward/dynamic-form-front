<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Plus, Share } from '@element-plus/icons-vue'
import { generateId, getQueryTemplatesByTableId, saveQueryTemplate, deleteQueryTemplate, setDefaultQueryTemplate } from '@/utils/tableStorage'
import { LogicalOperator, QueryOperator } from '@/types/tableTypes'

// 定义 Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  tableId: {
    type: String,
    default: ''
  },
  fields: {
    type: Array,
    default: () => []
  },
  currentConditionGroup: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'query', 'saveTemplate'])

// 对话框的可见性（内部状态）
const dialogVisible = ref(false)

// 监听外部 modelValue 变化，同步到内部状态
watch(
  () => props.modelValue,
  (newVal) => {
    dialogVisible.value = newVal
  },
  { immediate: true }
)

// 监听内部状态变化，同步到外部
watch(
  dialogVisible,
  (newVal) => {
    emit('update:modelValue', newVal)
  }
)

// 查询模板列表
const queryTemplates = ref([])

// 查询模板对话框
const templateDialogVisible = ref(false)
const editingTemplate = ref(null)

// 当前激活的标签页
const activeTab = ref('conditions')

// 获取可查询的字段
const queryableFields = computed(() => {
  return props.fields.filter(field => {
    // 如果有查询配置，检查是否启用了查询
    if (field.queryConfig?.enabled !== undefined) {
      return field.queryConfig.enabled
    }
    // 默认所有字段都可查询
    return true
  })
})

// 查询操作符选项
const operatorOptions = [
  { label: '等于', value: QueryOperator.EQUAL, desc: '精确匹配' },
  { label: '不等于', value: QueryOperator.NOT_EQUAL, desc: '排除匹配' },
  { label: '大于', value: QueryOperator.GREATER, desc: '数值/日期比较' },
  { label: '小于', value: QueryOperator.LESS, desc: '数值/日期比较' },
  { label: '大于等于', value: QueryOperator.GREATER_EQUAL, desc: '数值/日期比较' },
  { label: '小于等于', value: QueryOperator.LESS_EQUAL, desc: '数值/日期比较' },
  { label: '包含', value: QueryOperator.LIKE, desc: '模糊查询' },
  { label: '不包含', value: QueryOperator.NOT_LIKE, desc: '排除模糊' },
  { label: '开头是', value: QueryOperator.LEFT_LIKE, desc: '左匹配' },
  { label: '结尾是', value: QueryOperator.RIGHT_LIKE, desc: '右匹配' },
  { label: '在范围内', value: QueryOperator.IN, desc: '多值匹配' },
  { label: '不在范围内', value: QueryOperator.NOT_IN, desc: '排除多值' },
  { label: '为空', value: QueryOperator.IS_NULL, desc: 'NULL检查' },
  { label: '不为空', value: QueryOperator.IS_NOT_NULL, desc: '非NULL检查' },
  { label: '介于', value: QueryOperator.BETWEEN, desc: '区间查询' },
  { label: '不介于', value: QueryOperator.NOT_BETWEEN, desc: '排除区间' }
]

// 检查操作符是否需要值
const operatorRequiresValue = (operator) => {
  return ![QueryOperator.IS_NULL, QueryOperator.IS_NOT_NULL].includes(operator)
}

// 检查操作符是否需要第二个值（BETWEEN）
const operatorRequiresSecondValue = (operator) => {
  return [QueryOperator.BETWEEN, QueryOperator.NOT_BETWEEN].includes(operator)
}

// 检查操作符是否需要多值（IN）
const operatorRequiresMultiValue = (operator) => {
  return [QueryOperator.IN, QueryOperator.NOT_IN].includes(operator)
}

// 条件组数据
const conditionGroup = ref({
  id: generateId(),
  operator: LogicalOperator.AND,
  conditions: [],
  childGroups: []
})

// 初始化条件组
const initConditionGroup = () => {
  if (props.currentConditionGroup) {
    conditionGroup.value = JSON.parse(JSON.stringify(props.currentConditionGroup))
  } else {
    conditionGroup.value = {
      id: generateId(),
      operator: LogicalOperator.AND,
      conditions: [
        {
          id: generateId(),
          fieldId: '',
          fieldCode: '',
          fieldName: '',
          operator: QueryOperator.EQUAL,
          value: '',
          value2: '',
          enabled: true
        }
      ],
      childGroups: []
    }
  }
}

// 添加条件
const addCondition = () => {
  conditionGroup.value.conditions.push({
    id: generateId(),
    fieldId: '',
    fieldCode: '',
    fieldName: '',
    operator: QueryOperator.EQUAL,
    value: '',
    value2: '',
    enabled: true
  })
}

// 删除条件
const removeCondition = (index) => {
  if (conditionGroup.value.conditions.length <= 1) {
    ElMessage.warning('至少需要保留一个查询条件')
    return
  }
  conditionGroup.value.conditions.splice(index, 1)
}

// 添加子条件组
const addChildGroup = () => {
  conditionGroup.value.childGroups.push({
    id: generateId(),
    operator: LogicalOperator.OR,
    conditions: [
      {
        id: generateId(),
        fieldId: '',
        fieldCode: '',
        fieldName: '',
        operator: QueryOperator.EQUAL,
        value: '',
        value2: '',
        enabled: true
      }
    ],
    childGroups: []
  })
}

// 删除子条件组
const removeChildGroup = (index) => {
  conditionGroup.value.childGroups.splice(index, 1)
}

// 选择字段时设置相关信息
const handleFieldSelect = (condition, fieldId) => {
  const field = queryableFields.value.find(f => f.id === fieldId)
  if (field) {
    condition.fieldCode = field.fieldCode
    condition.fieldName = field.fieldName
  }
}

// 重置查询条件
const resetConditions = () => {
  conditionGroup.value = {
    id: generateId(),
    operator: LogicalOperator.AND,
    conditions: [
      {
        id: generateId(),
        fieldId: '',
        fieldCode: '',
        fieldName: '',
        operator: QueryOperator.EQUAL,
        value: '',
        value2: '',
        enabled: true
      }
    ],
    childGroups: []
  }
  ElMessage.info('查询条件已重置')
}

// 执行查询
const executeQuery = () => {
  // 验证条件
  const hasValidCondition = validateConditionGroup(conditionGroup.value)
  if (!hasValidCondition) {
    ElMessage.warning('请至少配置一个有效的查询条件')
    return
  }

  emit('query', JSON.parse(JSON.stringify(conditionGroup.value)))
  emit('update:modelValue', false)
}

// 验证条件组是否有有效的条件
const validateConditionGroup = (group) => {
  // 检查当前组的条件
  for (const condition of group.conditions) {
    if (condition.enabled && condition.fieldId) {
      return true
    }
  }
  // 检查子组
  for (const childGroup of group.childGroups) {
    if (validateConditionGroup(childGroup)) {
      return true
    }
  }
  return false
}

// 获取操作符标签
const getOperatorLabel = (operator) => {
  const option = operatorOptions.find(o => o.value === operator)
  return option?.label || operator
}

// 加载查询模板列表
const loadQueryTemplates = () => {
  if (props.tableId) {
    queryTemplates.value = getQueryTemplatesByTableId(props.tableId)
  }
}

// 保存为模板
const saveAsTemplate = () => {
  editingTemplate.value = {
    id: '',
    tableId: props.tableId,
    name: '',
    description: '',
    conditionGroup: JSON.parse(JSON.stringify(conditionGroup.value)),
    isDefault: false
  }
  templateDialogVisible.value = true
}

// 保存模板
const confirmSaveTemplate = async () => {
  if (!editingTemplate.value.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }

  const template = {
    id: editingTemplate.value.id || generateId(),
    tableId: props.tableId,
    name: editingTemplate.value.name.trim(),
    description: editingTemplate.value.description?.trim() || '',
    conditionGroup: JSON.parse(JSON.stringify(editingTemplate.value.conditionGroup)),
    isDefault: editingTemplate.value.isDefault,
    createTime: '',
    updateTime: ''
  }

  saveQueryTemplate(template)
  
  if (template.isDefault) {
    setDefaultQueryTemplate(props.tableId, template.id)
  }

  loadQueryTemplates()
  templateDialogVisible.value = false
  ElMessage.success('模板保存成功')
}

// 加载模板
const loadTemplate = (template) => {
  conditionGroup.value = JSON.parse(JSON.stringify(template.conditionGroup))
  activeTab.value = 'conditions'
  ElMessage.success(`已加载模板：${template.name}`)
}

// 删除模板
const handleDeleteTemplate = async (template) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除模板"${template.name}"吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    deleteQueryTemplate(template.id)
    loadQueryTemplates()
    ElMessage.success('模板已删除')
  } catch {
    // 用户取消
  }
}

// 设置默认模板
const handleSetDefault = (template) => {
  setDefaultQueryTemplate(props.tableId, template.id)
  loadQueryTemplates()
  ElMessage.success(`已设置"${template.name}"为默认模板`)
}

// 监听弹窗显示
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      initConditionGroup()
      loadQueryTemplates()
    }
  }
)

onMounted(() => {
  loadQueryTemplates()
})

// 辅助函数
const countConditions = (group) => {
  let count = group.conditions.filter(c => c.enabled).length
  group.childGroups.forEach(g => {
    count += countConditions(g)
  })
  return count
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <el-dialog
    v-model="dialogVisible"
    title="高级查询"
    width="900px"
    :close-on-click-modal="false"
    destroy-on-close
    class="advanced-query-dialog"
  >
    <!-- 标签页 -->
    <el-tabs v-model="activeTab">
      <!-- 查询条件标签页 -->
      <el-tab-pane label="查询条件" name="conditions">
        <div class="query-conditions">
          <!-- 主条件组 -->
          <div class="condition-group">
            <div class="group-header">
              <el-select
                v-model="conditionGroup.operator"
                size="large"
                style="width: 120px"
              >
                <el-option :label="逻辑与(AND)" :value="LogicalOperator.AND" />
                <el-option :label="逻辑或(OR)" :value="LogicalOperator.OR" />
              </el-select>
              <span class="group-label">条件组</span>
            </div>

            <!-- 条件列表 -->
            <div class="conditions-list">
              <div
                v-for="(condition, index) in conditionGroup.conditions"
                :key="condition.id"
                class="condition-item"
              >
                <div class="condition-row">
                  <!-- 逻辑运算符（非第一个条件显示） -->
                  <div class="condition-logic" v-if="index > 0">
                    <span class="logic-text">{{ conditionGroup.operator }}</span>
                  </div>
                  <div class="condition-logic-placeholder" v-else></div>

                  <!-- 启用开关 -->
                  <el-switch
                    v-model="condition.enabled"
                    size="small"
                    active-color="#67C23A"
                    inactive-color="#909399"
                  />

                  <!-- 字段选择 -->
                  <el-select
                    v-model="condition.fieldId"
                    placeholder="选择字段"
                    clearable
                    filterable
                    style="width: 160px"
                    @change="handleFieldSelect(condition, $event)"
                  >
                    <el-option
                      v-for="field in queryableFields"
                      :key="field.id"
                      :label="`${field.fieldName} (${field.fieldCode})`"
                      :value="field.id"
                    />
                  </el-select>

                  <!-- 操作符选择 -->
                  <el-select
                    v-model="condition.operator"
                    placeholder="选择操作符"
                    style="width: 120px"
                  >
                    <el-option
                      v-for="op in operatorOptions"
                      :key="op.value"
                      :label="op.label"
                      :value="op.value"
                    />
                  </el-select>

                  <!-- 值输入框 -->
                  <template v-if="operatorRequiresValue(condition.operator)">
                    <!-- BETWEEN 需要两个值 -->
                    <template v-if="operatorRequiresSecondValue(condition.operator)">
                      <el-input
                        v-model="condition.value"
                        placeholder="起始值"
                        clearable
                        style="width: 120px"
                      />
                      <span class="between-text">至</span>
                      <el-input
                        v-model="condition.value2"
                        placeholder="结束值"
                        clearable
                        style="width: 120px"
                      />
                    </template>
                    <!-- IN 需要多值（简化为逗号分隔） -->
                    <template v-else-if="operatorRequiresMultiValue(condition.operator)">
                      <el-input
                        v-model="condition.value"
                        placeholder="多个值用逗号分隔"
                        clearable
                        style="width: 200px"
                      />
                    </template>
                    <!-- 普通单值 -->
                    <template v-else>
                      <el-input
                        v-model="condition.value"
                        placeholder="输入值"
                        clearable
                        style="width: 160px"
                      />
                    </template>
                  </template>

                  <!-- 删除按钮 -->
                  <el-button
                    type="danger"
                    link
                    size="small"
                    class="remove-btn"
                    @click="removeCondition(index)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="group-actions">
              <el-button type="primary" link @click="addCondition">
                <el-icon><Plus /></el-icon>
                添加条件
              </el-button>
              <el-button type="info" link @click="addChildGroup">
                <el-icon><Share /></el-icon>
                添加条件组
              </el-button>
            </div>
          </div>

          <!-- 子条件组列表 -->
          <div
            v-for="(childGroup, groupIndex) in conditionGroup.childGroups"
            :key="childGroup.id"
            class="child-group-wrapper"
          >
            <div class="group-separator">
              <span class="separator-text">{{ conditionGroup.operator }}</span>
            </div>
            
            <div class="condition-group child-group">
              <div class="group-header">
                <el-select
                  v-model="childGroup.operator"
                  size="large"
                  style="width: 120px"
                >
                  <el-option :label="逻辑与(AND)" :value="LogicalOperator.AND" />
                  <el-option :label="逻辑或(OR)" :value="LogicalOperator.OR" />
                </el-select>
                <span class="group-label">子条件组</span>
                <el-button
                  type="danger"
                  link
                  size="small"
                  @click="removeChildGroup(groupIndex)"
                >
                  <el-icon><Delete /></el-icon>
                  删除组
                </el-button>
              </div>

              <div class="conditions-list">
                <div
                  v-for="(condition, index) in childGroup.conditions"
                  :key="condition.id"
                  class="condition-item"
                >
                  <div class="condition-row">
                    <div class="condition-logic" v-if="index > 0">
                      <span class="logic-text">{{ childGroup.operator }}</span>
                    </div>
                    <div class="condition-logic-placeholder" v-else></div>

                    <el-switch
                      v-model="condition.enabled"
                      size="small"
                      active-color="#67C23A"
                      inactive-color="#909399"
                    />

                    <el-select
                      v-model="condition.fieldId"
                      placeholder="选择字段"
                      clearable
                      filterable
                      style="width: 160px"
                      @change="handleFieldSelect(condition, $event)"
                    >
                      <el-option
                        v-for="field in queryableFields"
                        :key="field.id"
                        :label="`${field.fieldName} (${field.fieldCode})`"
                        :value="field.id"
                      />
                    </el-select>

                    <el-select
                      v-model="condition.operator"
                      placeholder="选择操作符"
                      style="width: 120px"
                    >
                      <el-option
                        v-for="op in operatorOptions"
                        :key="op.value"
                        :label="op.label"
                        :value="op.value"
                      />
                    </el-select>

                    <template v-if="operatorRequiresValue(condition.operator)">
                      <template v-if="operatorRequiresSecondValue(condition.operator)">
                        <el-input
                          v-model="condition.value"
                          placeholder="起始值"
                          clearable
                          style="width: 120px"
                        />
                        <span class="between-text">至</span>
                        <el-input
                          v-model="condition.value2"
                          placeholder="结束值"
                          clearable
                          style="width: 120px"
                        />
                      </template>
                      <template v-else-if="operatorRequiresMultiValue(condition.operator)">
                        <el-input
                          v-model="condition.value"
                          placeholder="多个值用逗号分隔"
                          clearable
                          style="width: 200px"
                        />
                      </template>
                      <template v-else>
                        <el-input
                          v-model="condition.value"
                          placeholder="输入值"
                          clearable
                          style="width: 160px"
                        />
                      </template>
                    </template>

                    <el-button
                      type="danger"
                      link
                      size="small"
                      class="remove-btn"
                      @click="childGroup.conditions.splice(index, 1)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </div>

              <div class="group-actions">
                <el-button type="primary" link @click="childGroup.conditions.push({ id: generateId(), fieldId: '', fieldCode: '', fieldName: '', operator: QueryOperator.EQUAL, value: '', value2: '', enabled: true })">
                  <el-icon><Plus /></el-icon>
                  添加条件
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 查询模板标签页 -->
      <el-tab-pane label="查询模板" name="templates">
        <div class="query-templates">
          <div class="template-header">
            <span class="template-title">已保存的查询模板</span>
            <el-button type="primary" size="small" @click="saveAsTemplate">
              <el-icon><Plus /></el-icon>
              保存当前条件
            </el-button>
          </div>

          <el-empty v-if="queryTemplates.length === 0" description="暂无保存的查询模板" />

          <div v-else class="template-list">
            <div
              v-for="template in queryTemplates"
              :key="template.id"
              class="template-item"
              :class="{ 'is-default': template.isDefault }"
            >
              <div class="template-info">
                <div class="template-name">
                  <el-tag v-if="template.isDefault" type="primary" size="small" effect="dark">默认</el-tag>
                  <span>{{ template.name }}</span>
                </div>
                <div v-if="template.description" class="template-desc">
                  {{ template.description }}
                </div>
                <div class="template-meta">
                  <span>条件数：{{ countConditions(template.conditionGroup) }}</span>
                  <span>更新时间：{{ formatTime(template.updateTime) }}</span>
                </div>
              </div>
              <div class="template-actions">
                <el-button type="primary" link size="small" @click="loadTemplate(template)">
                  加载
                </el-button>
                <el-button
                  type="warning"
                  link
                  size="small"
                  @click="handleSetDefault(template)"
                  :disabled="template.isDefault"
                >
                  设为默认
                </el-button>
                <el-button type="danger" link size="small" @click="handleDeleteTemplate(template)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <el-button @click="resetConditions">重置</el-button>
      <el-button @click="saveAsTemplate">保存为模板</el-button>
      <el-button type="primary" @click="executeQuery">查询</el-button>
    </template>
  </el-dialog>

  <!-- 保存模板对话框 -->
  <el-dialog
    v-model="templateDialogVisible"
    title="保存为查询模板"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form label-position="top">
      <el-form-item label="模板名称">
        <el-input
          v-model="editingTemplate.name"
          placeholder="请输入模板名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="模板描述（可选）">
        <el-input
          v-model="editingTemplate.description"
          type="textarea"
          :rows="3"
          placeholder="请输入模板描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="设为默认模板">
        <el-switch v-model="editingTemplate.isDefault" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="templateDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="confirmSaveTemplate">保存</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
.advanced-query-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.advanced-query-dialog :deep(.el-tabs__header) {
  margin: 0;
  padding: 0 20px;
  border-bottom: 1px solid #ebeef5;
}

.query-conditions {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

/* 条件组样式 */
.condition-group {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #fafafa;
}

.condition-group.child-group {
  background: #f5f7fa;
  border-color: #c0c4cc;
}

.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #c6e2ff;
}

.group-label {
  font-weight: 600;
  color: #409EFF;
  font-size: 14px;
}

.conditions-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.condition-item {
  padding: 12px;
  background: #fff;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}

.condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.condition-logic {
  min-width: 60px;
  display: flex;
  justify-content: center;
}

.condition-logic-placeholder {
  min-width: 60px;
}

.logic-text {
  font-weight: 700;
  color: #409EFF;
  font-size: 13px;
  padding: 4px 8px;
  background: #ecf5ff;
  border-radius: 4px;
  border: 1px solid #b3d8ff;
}

.between-text {
  color: #909399;
  font-size: 13px;
}

.remove-btn {
  margin-left: auto;
}

.group-actions {
  padding: 0 16px 16px;
  display: flex;
  gap: 16px;
}

/* 子条件组分隔符 */
.child-group-wrapper {
  margin-top: 16px;
}

.group-separator {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.group-separator::before,
.group-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, #dcdfe6, transparent);
}

.separator-text {
  padding: 0 16px;
  font-weight: 700;
  color: #409EFF;
  font-size: 14px;
}

/* 查询模板样式 */
.query-templates {
  padding: 20px;
  max-height: 500px;
  overflow-y: auto;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.template-title {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.template-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.template-item {
  padding: 16px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  transition: all 0.3s;
}

.template-item:hover {
  border-color: #409EFF;
  background: #ecf5ff;
}

.template-item.is-default {
  border-color: #409EFF;
  background: linear-gradient(135deg, #ecf5ff 0%, #d9ecff 100%);
}

.template-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.template-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #c0c4cc;
}

.template-actions {
  display: flex;
  gap: 8px;
}
</style>
