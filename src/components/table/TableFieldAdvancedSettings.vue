<script setup>
import { ref, computed, watch } from 'vue'
import {
  TableField,
  DataSourceType,
  DataSourceConfig,
  FieldDisplayConfig,
  LoginInfoField
} from '@/types/tableTypes'

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

// 数据来源类型选项
const dataSourceTypeOptions = [
  { label: '用户输入', value: 'userInput' as DataSourceType, desc: '用户在表单中手动输入' },
  { label: '登录信息', value: 'loginInfo' as DataSourceType, desc: '从当前登录用户信息中获取' },
  { label: '系统默认', value: 'systemDefault' as DataSourceType, desc: '使用系统默认值' },
  { label: '字典', value: 'dict' as DataSourceType, desc: '从数据字典中获取选项' },
  { label: '自定义', value: 'custom' as DataSourceType, desc: '使用自定义表达式或值' }
]

// 登录信息字段选项
const loginInfoFieldOptions = [
  { label: '用户ID', value: 'userId' as LoginInfoField },
  { label: '用户名', value: 'userName' as LoginInfoField },
  { label: '部门ID', value: 'deptId' as LoginInfoField },
  { label: '部门名称', value: 'deptName' as LoginInfoField },
  { label: '角色ID', value: 'roleId' as LoginInfoField },
  { label: '角色名称', value: 'roleName' as LoginInfoField },
  { label: '租户ID', value: 'tenantId' as LoginInfoField },
  { label: '组织ID', value: 'orgId' as LoginInfoField }
]

// 当前编辑的字段副本
const localField = ref<TableField>({ ...props.modelValue })

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
      type: 'userInput' as DataSourceType
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

// 数据来源类型
const dataSourceType = computed({
  get: () => {
    ensureDataSource()
    return localField.value.dataSource!.type
  },
  set: (val: DataSourceType) => {
    ensureDataSource()
    localField.value.dataSource!.type = val
    // 重置其他字段
    localField.value.dataSource!.loginInfoField = undefined
    localField.value.dataSource!.dictCode = undefined
    localField.value.dataSource!.customValue = undefined
    localField.value.dataSource!.expression = undefined
    updateField()
  }
})

// 登录信息字段
const loginInfoField = computed({
  get: () => {
    ensureDataSource()
    return localField.value.dataSource!.loginInfoField
  },
  set: (val: LoginInfoField | undefined) => {
    ensureDataSource()
    localField.value.dataSource!.loginInfoField = val
    updateField()
  }
})

// 字典编码
const dictCode = computed({
  get: () => {
    ensureDataSource()
    return localField.value.dataSource!.dictCode
  },
  set: (val: string | undefined) => {
    ensureDataSource()
    localField.value.dataSource!.dictCode = val
    updateField()
  }
})

// 自定义值
const customValue = computed({
  get: () => {
    ensureDataSource()
    return localField.value.dataSource!.customValue
  },
  set: (val: string | undefined) => {
    ensureDataSource()
    localField.value.dataSource!.customValue = val
    updateField()
  }
})

// 显示配置 - 列表显示
const showInList = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig!.showInList
  },
  set: (val: boolean) => {
    ensureDisplayConfig()
    localField.value.displayConfig!.showInList = val
    updateField()
  }
})

// 显示配置 - 表单显示
const showInForm = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig!.showInForm
  },
  set: (val: boolean) => {
    ensureDisplayConfig()
    localField.value.displayConfig!.showInForm = val
    updateField()
  }
})

// 显示配置 - 详情显示
const showInDetail = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig!.showInDetail
  },
  set: (val: boolean) => {
    ensureDisplayConfig()
    localField.value.displayConfig!.showInDetail = val
    updateField()
  }
})

// 显示配置 - 列表宽度
const listWidth = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig!.listWidth
  },
  set: (val: number | undefined) => {
    ensureDisplayConfig()
    localField.value.displayConfig!.listWidth = val
    updateField()
  }
})

// 显示配置 - 列表排序
const listSort = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig!.listSort
  },
  set: (val: number) => {
    ensureDisplayConfig()
    localField.value.displayConfig!.listSort = val
    updateField()
  }
})

// 显示配置 - 表单排序
const formSort = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig!.formSort
  },
  set: (val: number) => {
    ensureDisplayConfig()
    localField.value.displayConfig!.formSort = val
    updateField()
  }
})

// 显示配置 - 只读
const readonly = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig!.readonly
  },
  set: (val: boolean) => {
    ensureDisplayConfig()
    localField.value.displayConfig!.readonly = val
    updateField()
  }
})

// 显示配置 - 隐藏
const hidden = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig!.hidden
  },
  set: (val: boolean) => {
    ensureDisplayConfig()
    localField.value.displayConfig!.hidden = val
    updateField()
  }
})

// 显示配置 - 占位符
const placeholder = computed({
  get: () => {
    ensureDisplayConfig()
    return localField.value.displayConfig!.placeholder
  },
  set: (val: string | undefined) => {
    ensureDisplayConfig()
    localField.value.displayConfig!.placeholder = val
    updateField()
  }
})

// 更新字段
const updateField = () => {
  emit('update:modelValue', { ...localField.value })
}

// 获取数据来源描述
const getDataSourceDesc = (type: DataSourceType) => {
  const option = dataSourceTypeOptions.find(o => o.value === type)
  return option?.desc || ''
}
</script>

<template>
  <div class="field-advanced-settings">
    <el-divider content-position="left">数据来源设置</el-divider>
    
    <el-form label-width="120px">
      <el-form-item label="数据来源类型">
        <el-radio-group v-model="dataSourceType" :disabled="disabled">
          <el-radio
            v-for="option in dataSourceTypeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </el-radio>
        </el-radio-group>
        <div class="desc-text">{{ getDataSourceDesc(dataSourceType) }}</div>
      </el-form-item>

      <!-- 登录信息字段选择 -->
      <el-form-item
        v-if="dataSourceType === 'loginInfo'"
        label="登录信息字段"
      >
        <el-select
          v-model="loginInfoField"
          placeholder="请选择登录信息字段"
          style="width: 200px"
          :disabled="disabled"
          clearable
        >
          <el-option
            v-for="option in loginInfoFieldOptions"
            :key="option.value"
            :label="option.label"
            :value="option.value"
          />
        </el-select>
        <div class="desc-text">选择从登录信息中获取哪个字段的值</div>
      </el-form-item>

      <!-- 字典编码 -->
      <el-form-item
        v-if="dataSourceType === 'dict'"
        label="字典编码"
      >
        <el-input
          v-model="dictCode"
          placeholder="请输入字典编码"
          style="width: 200px"
          :disabled="disabled"
          clearable
        />
        <div class="desc-text">输入数据字典的编码，用于获取下拉选项</div>
      </el-form-item>

      <!-- 自定义值 -->
      <el-form-item
        v-if="dataSourceType === 'custom'"
        label="自定义值"
      >
        <el-input
          v-model="customValue"
          placeholder="请输入自定义值或表达式"
          style="width: 300px"
          :disabled="disabled"
          clearable
          type="textarea"
          :rows="2"
        />
        <div class="desc-text">输入自定义的默认值或表达式</div>
      </el-form-item>
    </el-form>

    <el-divider content-position="left">显示设置</el-divider>

    <el-form label-width="120px">
      <el-form-item label="显示控制">
        <el-checkbox v-model="showInList" :disabled="disabled">列表显示</el-checkbox>
        <el-checkbox v-model="showInForm" :disabled="disabled">表单显示</el-checkbox>
        <el-checkbox v-model="showInDetail" :disabled="disabled">详情显示</el-checkbox>
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="8">
          <el-form-item label="列表宽度">
            <el-input-number
              v-model="listWidth"
              :min="50"
              :max="1000"
              :disabled="disabled"
              placeholder="像素"
              controls-position="right"
              style="width: 100%"
            />
            <div class="desc-text">列表中该列的宽度（像素）</div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="列表排序">
            <el-input-number
              v-model="listSort"
              :min="0"
              :disabled="disabled"
              controls-position="right"
              style="width: 100%"
            />
            <div class="desc-text">在列表中的显示顺序</div>
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="表单排序">
            <el-input-number
              v-model="formSort"
              :min="0"
              :disabled="disabled"
              controls-position="right"
              style="width: 100%"
            />
            <div class="desc-text">在表单中的显示顺序</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="其他属性">
        <el-checkbox v-model="readonly" :disabled="disabled">只读</el-checkbox>
        <el-checkbox v-model="hidden" :disabled="disabled">隐藏</el-checkbox>
      </el-form-item>

      <el-form-item label="占位符">
        <el-input
          v-model="placeholder"
          placeholder="请输入表单占位符文本"
          style="width: 300px"
          :disabled="disabled"
          clearable
        />
        <div class="desc-text">表单输入框的占位提示文本</div>
      </el-form-item>
    </el-form>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-top: 16px"
    >
      <template #title>
        提示：
        <ul style="margin: 8px 0 0 20px; padding: 0">
          <li>数据来源为"登录信息"时，该字段在表单中会自动填充当前登录用户的对应信息</li>
          <li>数据来源为"系统默认"时，使用字段配置的默认值</li>
          <li>"隐藏"属性会使字段在列表和表单中都不显示，但数据仍会保存</li>
          <li>"只读"属性使字段在表单中显示但不可编辑</li>
        </ul>
      </template>
    </el-alert>
  </div>
</template>

<style scoped>
.field-advanced-settings {
  padding: 10px 0;
}

.desc-text {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}
</style>
