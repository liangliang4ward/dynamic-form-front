import type {
  TableConfig,
  TableListQuery,
  TableListResponse,
  DataRecord,
  DataListQuery,
  DataListResponse
} from '@/types/tableTypes'
import {
  getAllTableConfigs,
  getTableConfigById,
  saveTableConfig,
  deleteTableConfig,
  isTableCodeUnique,
  getMainTableList,
  generateId,
  getAllDataRecords,
  getDataRecordsByTableId,
  getDataRecordById,
  saveDataRecord,
  deleteDataRecord
} from '@/utils/tableStorage'

/**
 * 模拟API延迟
 */
function delay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * 获取表配置列表
 */
export async function getTableList(query: TableListQuery = {}): Promise<TableListResponse> {
  await delay()
  
  let configs = getAllTableConfigs()
  
  // 关键字搜索
  if (query.keyword) {
    const keyword = query.keyword.toLowerCase()
    configs = configs.filter(
      (c) =>
        c.info.tableName.toLowerCase().includes(keyword) ||
        c.info.tableCode.toLowerCase().includes(keyword)
    )
  }
  
  // 按创建时间倒序
  configs.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
  
  return {
    list: configs,
    total: configs.length
  }
}

/**
 * 获取表配置详情
 */
export async function getTableDetail(id: string): Promise<TableConfig | null> {
  await delay()
  return getTableConfigById(id)
}

/**
 * 保存表配置
 */
export async function saveTable(config: TableConfig): Promise<{ success: boolean; message: string }> {
  await delay()
  
  // 检查表编码唯一性
  if (!isTableCodeUnique(config.info.tableCode, config.id)) {
    return {
      success: false,
      message: '表编码已存在，请使用其他编码'
    }
  }
  
  // 确保queryFields存在
  if (!config.queryFields) {
    config.queryFields = []
  }
  
  // 更新时间
  const now = new Date().toISOString()
  if (!config.createTime) {
    config.createTime = now
  }
  config.updateTime = now
  
  saveTableConfig(config)
  
  return {
    success: true,
    message: '保存成功'
  }
}

/**
 * 删除表配置
 */
export async function deleteTable(id: string): Promise<{ success: boolean; message: string }> {
  await delay()
  
  const result = deleteTableConfig(id)
  
  if (result) {
    return {
      success: true,
      message: '删除成功'
    }
  }
  
  return {
    success: false,
    message: '删除失败，表配置不存在'
  }
}

/**
 * 检查表编码是否唯一
 */
export async function checkTableCode(code: string, excludeId?: string): Promise<{ unique: boolean }> {
  await delay(100)
  return {
    unique: isTableCodeUnique(code, excludeId)
  }
}

/**
 * 获取主表列表
 */
export async function getMainTables(): Promise<TableConfig[]> {
  await delay()
  return getMainTableList()
}

/**
 * 生成新的表配置（带默认值）
 */
export function createNewTableConfig(): TableConfig {
  return {
    id: generateId(),
    info: {
      tableName: '',
      tableCode: '',
      tableDesc: '',
      tableType: 'single' as const,
      mainTableCode: undefined
    },
    groups: [],
    fields: [],
    indexes: [],
    queryFields: [],
    createTime: '',
    updateTime: ''
  }
}

// ==================== 数据记录API ====================

/**
 * 获取数据列表
 */
export async function getDataList(query: DataListQuery): Promise<DataListResponse> {
  await delay()
  
  let records = getDataRecordsByTableId(query.tableId)
  
  // 简单的条件过滤（Mock实现）
  if (query.conditions && Object.keys(query.conditions).length > 0) {
    records = records.filter(record => {
      for (const [key, value] of Object.entries(query.conditions!)) {
        if (value === undefined || value === null || value === '') continue
        const recordValue = record.data[key]
        if (recordValue === undefined || recordValue === null) return false
        // 简单的包含匹配
        if (!String(recordValue).toLowerCase().includes(String(value).toLowerCase())) {
          return false
        }
      }
      return true
    })
  }
  
  // 按创建时间倒序
  records.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime())
  
  // 分页
  const page = query.page || 1
  const pageSize = query.pageSize || 10
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pagedRecords = records.slice(start, end)
  
  return {
    list: pagedRecords,
    total: records.length
  }
}

/**
 * 获取数据记录详情
 */
export async function getDataDetail(id: string): Promise<DataRecord | null> {
  await delay()
  return getDataRecordById(id)
}

/**
 * 保存数据记录
 */
export async function saveData(record: DataRecord): Promise<{ success: boolean; message: string; id: string }> {
  await delay()
  
  const isNew = !record.id
  if (isNew) {
    record.id = generateId()
  }
  
  saveDataRecord(record)
  
  return {
    success: true,
    message: isNew ? '新增成功' : '更新成功',
    id: record.id
  }
}

/**
 * 删除数据记录
 */
export async function deleteData(id: string): Promise<{ success: boolean; message: string }> {
  await delay()
  
  const result = deleteDataRecord(id)
  
  if (result) {
    return {
      success: true,
      message: '删除成功'
    }
  }
  
  return {
    success: false,
    message: '删除失败，数据不存在'
  }
}

/**
 * 生成新的数据记录（带默认值）
 */
export function createNewDataRecord(tableId) {
  return {
    id: '',
    tableId,
    data: {},
    createTime: '',
    updateTime: ''
  }
}

// ==================== Mock数据生成 ====================

// 中文姓氏库
const chineseSurnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '胡', '朱', '高', '林', '何', '郭', '马', '罗', '梁', '宋', '郑', '谢', '韩', '唐', '冯', '于', '董', '萧', '程', '曹', '袁', '邓', '许', '傅', '沈', '曾', '彭', '吕', '苏', '卢', '蒋', '蔡', '贾', '丁', '魏', '薛', '叶', '阎', '余', '潘', '杜', '戴', '夏', '钟', '汪', '田', '任', '姜', '范', '方', '石', '姚', '谭', '廖', '邹', '熊', '金', '陆', '郝', '孔', '白', '崔', '康', '毛', '邱', '秦', '江', '史', '顾', '侯', '邵', '孟', '龙', '万', '段', '雷', '钱', '汤', '尹', '黎', '易', '常', '武', '乔', '贺', '赖', '龚', '文']

// 中文名字库
const chineseNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '涛', '明', '超', '秀兰', '霞', '平', '刚', '桂英', '文', '华', '玲', '辉', '鑫', '斌', '波', '宇', '浩', '凯', '健', '俊', '帅', '晨', '博', '婷', '雪', '倩', '琳', '欣', '颖', '佳', '悦', '璐', '瑶', '怡', '宁', '梦', '琪', '瑶', '妍', '茜', '雯', '静', '雅', '诗', '乐', '晨', '轩', '然', '涵', '诺', '妍', '昕', '瑜', '瑞', '睿', '航', '泽', '豪', '昊', '然', '翔', '鹏', '博', '文', '武', '双', '全', '福', '禄', '寿', '喜', '财', '富', '贵', '康', '健', '安', '顺', '平', '和', '谐', '美', '好', '优', '良', '佳', '妙', '巧', '灵', '敏', '捷', '快', '速', '迅', '猛', '刚', '强', '壮', '健', '康', '稳', '重', '轻', '高', '低', '长', '短', '大', '小', '多', '少', '全', '新', '旧', '老', '幼', '男', '女', '公', '私', '正', '反', '对', '错', '是', '非', '真', '假', '虚', '实', '空', '满', '深', '浅', '厚', '薄', '宽', '窄', '紧', '松', '硬', '软', '冷', '热', '温', '凉', '干', '湿', '清', '浊', '纯', '杂', '浓', '淡', '香', '臭', '甜', '苦', '酸', '辣', '咸', '淡']

// 部门名称
const departmentNames = ['技术部', '产品部', '市场部', '销售部', '人力资源部', '财务部', '行政部', '运营部', '客服部', '研发部', '测试部', '运维部', '设计部', '策划部', '商务部', '法务部', '审计部', '采购部', '仓储部', '物流部']

// 角色名称
const roleNames = ['管理员', '普通用户', '访客', '部门经理', '总监', '总经理', '董事长', '系统管理员', '数据管理员', '安全管理员']

// 公司名称
const companyNames = ['科技有限公司', '信息技术有限公司', '网络科技有限公司', '软件有限公司', '电子科技有限公司', '数据科技有限公司', '智能科技有限公司', '云计算有限公司', '大数据有限公司', '人工智能有限公司']

// 地址前缀
const addressPrefixes = ['北京市朝阳区', '北京市海淀区', '上海市浦东新区', '广州市天河区', '深圳市南山区', '杭州市西湖区', '成都市武侯区', '武汉市洪山区', '南京市鼓楼区', '西安市雁塔区', '重庆市渝北区', '天津市和平区', '苏州市工业园区', '青岛市市南区', '大连市中山区', '宁波市鄞州区', '厦门市思明区', '济南市历下区', '沈阳市和平区', '长沙市芙蓉区']

// 生成随机整数
const randomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// 生成随机字符串
const randomString = (length) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// 生成随机中文姓名
const randomChineseName = () => {
  const surname = chineseSurnames[randomInt(0, chineseSurnames.length - 1)]
  const nameLength = randomInt(1, 2)
  let name = ''
  for (let i = 0; i < nameLength; i++) {
    name += chineseNames[randomInt(0, chineseNames.length - 1)]
  }
  return surname + name
}

// 生成随机手机号
const randomPhone = () => {
  const prefixes = ['130', '131', '132', '133', '134', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '180', '181', '182', '183', '184', '185', '186', '187', '188', '189']
  const prefix = prefixes[randomInt(0, prefixes.length - 1)]
  const suffix = randomInt(10000000, 99999999)
  return prefix + suffix
}

// 生成随机邮箱
const randomEmail = (name) => {
  const domains = ['gmail.com', 'qq.com', '163.com', '126.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'sina.com', 'sohu.com', '139.com']
  const domain = domains[randomInt(0, domains.length - 1)]
  const username = name ? name.toLowerCase().replace(/\s/g, '') + randomInt(100, 999) : randomString(8).toLowerCase()
  return `${username}@${domain}`
}

// 生成随机日期
const randomDate = (startYear = 2020, endYear = 2026) => {
  const year = randomInt(startYear, endYear)
  const month = randomInt(1, 12)
  const day = randomInt(1, 28)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

// 生成随机日期时间
const randomDateTime = (startYear = 2020, endYear = 2026) => {
  const date = randomDate(startYear, endYear)
  const hour = randomInt(0, 23)
  const minute = randomInt(0, 59)
  const second = randomInt(0, 59)
  return `${date} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`
}

// 生成随机部门
const randomDepartment = () => {
  return departmentNames[randomInt(0, departmentNames.length - 1)]
}

// 生成随机角色
const randomRole = () => {
  return roleNames[randomInt(0, roleNames.length - 1)]
}

// 生成随机公司名称
const randomCompany = () => {
  const prefix = chineseSurnames[randomInt(0, chineseSurnames.length - 1)] + chineseNames[randomInt(0, chineseNames.length - 1)]
  const suffix = companyNames[randomInt(0, companyNames.length - 1)]
  return prefix + suffix
}

// 生成随机地址
const randomAddress = () => {
  const prefix = addressPrefixes[randomInt(0, addressPrefixes.length - 1)]
  const streetNum = randomInt(1, 999)
  const buildingNum = randomInt(1, 50)
  const roomNum = randomInt(101, 2500)
  return `${prefix}某某路${streetNum}号${buildingNum}号楼${roomNum}室`
}

// 生成随机状态
const randomStatus = () => {
  const statuses = ['正常', '禁用', '待审核', '已审核', '已删除', '草稿', '发布', '下架']
  return statuses[randomInt(0, statuses.length - 1)]
}

// 生成随机性别
const randomGender = () => {
  return Math.random() > 0.5 ? '男' : '女'
}

// 生成随机年龄
const randomAge = (min = 18, max = 65) => {
  return randomInt(min, max)
}

// 生成随机工号
const randomEmployeeId = () => {
  const prefix = ['EMP', 'STAFF', 'USER', 'WORKER']
  return prefix[randomInt(0, prefix.length - 1)] + String(randomInt(10000, 99999))
}

// 根据字段类型和名称生成Mock数据
const generateMockValue = (field) => {
  const fieldCode = field.fieldCode?.toLowerCase() || ''
  const fieldName = field.fieldName?.toLowerCase() || ''
  const fieldType = field.fieldType
  const componentType = field.componentType

  // 根据字段编码或名称判断
  if (fieldCode.includes('name') || fieldName.includes('名称') || fieldName.includes('姓名')) {
    return randomChineseName()
  }
  if (fieldCode.includes('phone') || fieldCode.includes('mobile') || fieldName.includes('电话') || fieldName.includes('手机')) {
    return randomPhone()
  }
  if (fieldCode.includes('email') || fieldName.includes('邮箱') || fieldName.includes('邮件')) {
    return randomEmail()
  }
  if (fieldCode.includes('dept') || fieldCode.includes('department') || fieldName.includes('部门')) {
    return randomDepartment()
  }
  if (fieldCode.includes('role') || fieldName.includes('角色')) {
    return randomRole()
  }
  if (fieldCode.includes('company') || fieldName.includes('公司') || fieldName.includes('企业')) {
    return randomCompany()
  }
  if (fieldCode.includes('address') || fieldName.includes('地址')) {
    return randomAddress()
  }
  if (fieldCode.includes('status') || fieldName.includes('状态')) {
    return randomStatus()
  }
  if (fieldCode.includes('gender') || fieldName.includes('性别')) {
    return randomGender()
  }
  if (fieldCode.includes('age') || fieldName.includes('年龄')) {
    return randomAge()
  }
  if (fieldCode.includes('employee') || fieldCode.includes('emp') || fieldCode.includes('staff') || fieldName.includes('工号')) {
    return randomEmployeeId()
  }
  if (fieldCode.includes('id') || fieldName.includes('编号') || fieldName.includes('ID')) {
    return randomString(8).toUpperCase()
  }
  if (fieldCode.includes('remark') || fieldCode.includes('desc') || fieldName.includes('备注') || fieldName.includes('描述') || fieldName.includes('说明')) {
    const remarks = [
      '这是一条测试数据',
      '系统自动生成的Mock数据',
      '用于演示和测试用途',
      '数据内容仅供参考',
      '请根据实际情况修改',
      '这是一个示例数据',
      '用于功能演示',
      '测试数据，请勿用于生产环境'
    ]
    return remarks[randomInt(0, remarks.length - 1)]
  }

  // 根据字段类型判断
  if (fieldType === 'int' || componentType === 'number') {
    return randomInt(1, 10000)
  }
  if (fieldType === 'date' || componentType === 'date') {
    return randomDate()
  }
  if (fieldType === 'datetime' || fieldType === 'time' || componentType === 'time') {
    return randomDateTime()
  }
  if (componentType === 'radio') {
    return Math.random() > 0.5 ? '是' : '否'
  }
  if (componentType === 'select') {
    const options = ['选项A', '选项B', '选项C', '选项D', '选项E']
    return options[randomInt(0, options.length - 1)]
  }
  if (componentType === 'checkbox') {
    const options = ['选项1', '选项2', '选项3']
    const selected = []
    for (let i = 0; i < randomInt(1, 3); i++) {
      selected.push(options[randomInt(0, options.length - 1)])
    }
    return [...new Set(selected)]
  }
  if (componentType === 'richText' || fieldType === 'text') {
    const texts = [
      '这是一段富文本内容，用于演示数据录入功能。系统支持多种富文本编辑功能，包括文字格式化、图片插入、链接添加等。',
      'Mock数据生成器可以根据字段类型和名称智能生成测试数据。支持姓名、电话、邮箱、地址等多种常见字段类型的自动生成。',
      '动态表单系统支持根据表配置自动生成数据录入界面。用户可以通过配置字段类型、组件类型、数据来源等属性来定制表单。',
      '数据列表页面支持搜索、分页、排序等功能。用户可以通过配置查询字段来定制搜索条件，方便快速定位所需数据。'
    ]
    return texts[randomInt(0, texts.length - 1)]
  }

  // 默认返回字符串
  return `测试数据${randomInt(1, 1000)}`
}

/**
 * 生成Mock数据
 * @param tableId 表ID
 * @param count 生成数量
 * @param tableConfig 表配置（可选）
 */
export async function generateMockData(tableId, count = 10, tableConfig = null) {
  await delay()

  // 如果没有传入表配置，尝试获取
  if (!tableConfig) {
    tableConfig = getTableConfigById(tableId)
  }

  if (!tableConfig) {
    return {
      success: false,
      message: '表配置不存在'
    }
  }

  const fields = tableConfig.fields || []
  
  if (fields.length === 0) {
    return {
      success: false,
      message: '该表尚未配置字段，无法生成Mock数据'
    }
  }

  const now = new Date()
  const records = []

  for (let i = 0; i < count; i++) {
    const data = {}
    
    fields.forEach(field => {
      // 跳过隐藏字段
      if (field.displayConfig?.hidden) return
      
      // 生成Mock数据
      data[field.fieldCode] = generateMockValue(field)
    })

    // 生成时间偏移（每条数据时间不同）
    const timeOffset = (count - i) * 3600000 // 每条间隔1小时
    const recordTime = new Date(now.getTime() - timeOffset)

    records.push({
      id: generateId(),
      tableId,
      data,
      createTime: recordTime.toISOString(),
      updateTime: recordTime.toISOString()
    })
  }

  // 保存数据
  records.forEach(record => {
    saveDataRecord(record)
  })

  return {
    success: true,
    message: `成功生成 ${count} 条Mock数据`,
    count
  }
}
