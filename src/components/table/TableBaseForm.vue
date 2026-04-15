<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getMainTables, checkTableCode } from '@/api/tableMock'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  tableId: {
    type: String,
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const formRef = ref()

const mainTableList = ref([])

const tableTypeOptions = [
  { label: '单表', value: 'single' },
  { label: '主表', value: 'main' },
  { label: '附表', value: 'slave' }
]

const formData = ref({
  tableName: '',
  tableCode: '',
  tableDesc: '',
  tableType: 'single',
  mainTableCode: undefined
})

watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      formData.value = { ...newVal }
    }
  },
  { immediate: true, deep: true }
)

watch(
  formData,
  newVal => {
    emit('update:modelValue', { ...newVal })
  },
  { deep: true }
)

const showMainTableSelect = computed(() => {
  return formData.value.tableType === 'slave'
})

const formRules = computed(() => ({
  tableName: [
    { required: true, message: '请输入表名称', trigger: 'blur' },
    { min: 1, max: 100, message: '表名称长度在1到100个字符', trigger: 'blur' }
  ],
  tableCode: [
    { required: true, message: '请输入表编码', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: '表编码必须以字母开头，只能包含字母、数字和下划线',
      trigger: 'blur'
    },
    {
      validator: async (rule, value, callback) => {
        if (!value) {
          callback()
          return
        }
        try {
          const result = await checkTableCode(value, props.tableId)
          if (!result.unique) {
            callback(new Error('表编码已存在'))
          } else {
            callback()
          }
        } catch {
          callback(new Error('校验失败'))
        }
      },
      trigger: 'blur'
    }
  ],
  tableType: [{ required: true, message: '请选择表类型', trigger: 'change' }],
  mainTableCode: [
    {
      required: showMainTableSelect.value,
      message: '附表必须选择关联的主表',
      trigger: 'change'
    }
  ]
}))

const loadMainTables = async () => {
  try {
    mainTableList.value = await getMainTables()
  } catch (error) {
    ElMessage.error('加载主表列表失败')
    console.error(error)
  }
}

watch(
  () => formData.value.tableType,
  newType => {
    if (newType !== 'slave') {
      formData.value.mainTableCode = undefined
    }
  }
)

const validate = async () => {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

const clearValidate = () => {
  formRef.value?.clearValidate()
}

defineExpose({
  validate,
  clearValidate
})

onMounted(() => {
  loadMainTables()
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    :disabled="disabled"
    label-width="120px"
  >
    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="表名称" prop="tableName">
          <el-input
            v-model="formData.tableName"
            placeholder="请输入表名称"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
      </el-col>
      <el-col :span="12">
        <el-form-item label="表编码" prop="tableCode">
          <el-input
            v-model="formData.tableCode"
            placeholder="请输入表编码（英文）"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form-item label="表类型" prop="tableType">
          <el-select v-model="formData.tableType" placeholder="请选择表类型" style="width: 100%">
            <el-option
              v-for="item in tableTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-col>
      <el-col :span="12" v-if="showMainTableSelect">
        <el-form-item label="关联主表" prop="mainTableCode">
          <el-select
            v-model="formData.mainTableCode"
            placeholder="请选择关联的主表"
            style="width: 100%"
            filterable
          >
            <el-option
              v-for="table in mainTableList"
              :key="table.id"
              :label="`${table.info.tableName} (${table.info.tableCode})`"
              :value="table.info.tableCode"
            />
          </el-select>
        </el-form-item>
      </el-col>
    </el-row>

    <el-form-item label="表描述" prop="tableDesc">
      <el-input
        v-model="formData.tableDesc"
        type="textarea"
        :rows="3"
        placeholder="请输入表描述"
        maxlength="500"
        show-word-limit
      />
    </el-form-item>
  </el-form>
</template>

<style scoped></style>
