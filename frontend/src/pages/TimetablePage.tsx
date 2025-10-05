import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
  Form, 
  Input, 
  message, 
  Space, 
  Typography, 
  Table, 
  Tag, 
  Select,
  Modal,
  Alert,
  Spin,
  Row,
  Col,
  Divider,
  Tabs,
  Statistic,
  Progress,
  Tooltip,
  Popconfirm,
  Badge,
  List,
  Descriptions
} from 'antd'
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  SyncOutlined, 
  CalendarOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  SettingOutlined,
  ClearOutlined
} from '@ant-design/icons'
import { 
  createTimetable, 
  generateTimetable, 
  rescheduleTimetable, 
  syncCalendar,
  getTimetableData,
  getTimetableSections,
  checkTimetableConflicts,
  optimizeTimetable,
  exportTimetablePDF,
  clearTimetable,
  getTimetableStatistics,
  api,
  deleteTimetable
} from '../services/api'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

interface TimetableData {
  [section: string]: {
    [day: number]: Array<{
      id: number
      course_code: string
      course_name: string
      instructor: string
      room: string
      start_time: string
      end_time: string
      type: string
      color: string
    }>
  }
}

interface Conflict {
  type: string
  instructor?: string
  room?: string
  day: string
  time: string
  courses: string[]
  rooms?: string[]
  instructors?: string[]
  break_time?: string
}

const TimetablePage: React.FC = () => {
  const [form] = Form.useForm()
  const [timetables, setTimetables] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [timetableData, setTimetableData] = useState<TimetableData>({})
  const [selectedTimetable, setSelectedTimetable] = useState<number | null>(null)
  const [showTimetableModal, setShowTimetableModal] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [conflicts, setConflicts] = useState<Conflict[]>([])
  const [statistics, setStatistics] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('list')

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const timeSlots = [
    '08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00',
    '12:00-13:00', '13:00-14:00', '14:00-15:00', '15:00-16:00',
    '16:00-17:00', '17:00-18:00'
  ]

  useEffect(() => {
    fetchTimetables()
  }, [])

  const fetchTimetables = async () => {
    try {
      setLoading(true)
      const response = await api.get('/timetables/')
      console.log('Timetables response:', response.data)
      setTimetables(response.data.results || response.data || [])
    } catch (error) {
      console.error('Error fetching timetables:', error)
      message.error('Failed to fetch timetables')
    } finally {
      setLoading(false)
    }
  }

  const fetchTimetableData = async (timetableId: number) => {
    try {
      const response = await getTimetableData(timetableId)
      setTimetableData(response.data)
    } catch (error) {
      message.error('Failed to fetch timetable data')
    }
  }

  const fetchConflicts = async (timetableId: number) => {
    try {
      const response = await checkTimetableConflicts(timetableId)
      setConflicts(response.data.conflicts || [])
      return response.data
    } catch (error) {
      message.error('Failed to check conflicts')
      return { conflicts: [], conflict_count: 0 }
    }
  }

  const fetchStatistics = async (timetableId: number) => {
    try {
      const response = await getTimetableStatistics(timetableId)
      setStatistics(response.data)
    } catch (error) {
      message.error('Failed to fetch statistics')
    }
  }

  const createNewTimetable = async () => {
    try {
      setLoading(true)
      const name = form.getFieldValue('name') || 'New Timetable'
      console.log('Creating timetable with name:', name)
      const response = await createTimetable(name)
      console.log('Create timetable response:', response.data)
      message.success('Timetable created successfully')
      form.resetFields()
      await fetchTimetables()
    } catch (error: any) {
      console.error('Error creating timetable:', error)
      message.error(`Failed to create timetable: ${error?.response?.data?.detail || error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const generateTimetableForId = async (timetableId: number) => {
    try {
      setGenerating(true)
      const response = await generateTimetable()
      message.success(`Timetable generated successfully! Created ${response.data.created_sessions} sessions.`)
      
      if (response.data.conflicts && response.data.conflicts.length > 0) {
        message.warning(`Some conflicts detected: ${response.data.conflicts.join(', ')}`)
      }
      
      await fetchTimetables()
      await fetchConflicts(timetableId)
      await fetchStatistics(timetableId)
    } catch (error: any) {
      message.error('Failed to generate timetable')
    } finally {
      setGenerating(false)
    }
  }

  const rescheduleTimetableForId = async (timetableId: number) => {
    try {
      setGenerating(true)
      const response = await rescheduleTimetable(timetableId)
      message.success('Timetable rescheduled successfully')
      await fetchTimetables()
      await fetchConflicts(timetableId)
    } catch (error: any) {
      message.error('Failed to reschedule timetable')
    } finally {
      setGenerating(false)
    }
  }

  const optimizeTimetableForId = async (timetableId: number) => {
    try {
      setGenerating(true)
      const response = await optimizeTimetable(timetableId)
      message.success(response.data.message)
      await fetchTimetables()
      await fetchStatistics(timetableId)
    } catch (error: any) {
      message.error('Failed to optimize timetable')
    } finally {
      setGenerating(false)
    }
  }

  const syncToCalendar = async (timetableId: number) => {
    try {
      setGenerating(true)
      const response = await syncCalendar(timetableId)
      message.success(`Synced ${response.data.synced} events to calendar`)
    } catch (error: any) {
      message.error('Failed to sync to calendar')
    } finally {
      setGenerating(false)
    }
  }

  const clearTimetableForId = async (timetableId: number) => {
    try {
      setGenerating(true)
      const response = await clearTimetable(timetableId)
      message.success(`Cleared ${response.data.deleted_sessions} sessions`)
      await fetchTimetables()
      setTimetableData({})
      setConflicts([])
      setStatistics(null)
    } catch (error: any) {
      message.error('Failed to clear timetable')
    } finally {
      setGenerating(false)
    }
  }

  const viewTimetable = async (timetableId: number) => {
    setSelectedTimetable(timetableId)
    await fetchTimetableData(timetableId)
    await fetchConflicts(timetableId)
    await fetchStatistics(timetableId)
    setShowTimetableModal(true)
  }

  const downloadTimetablePDF = (timetableId: number) => {
    const url = exportTimetablePDF(timetableId)
    window.open(url, '_blank')
  }

  const handleDeleteTimetable = async (id: number) => {
    try {
      setLoading(true);
      await deleteTimetable(id);
      message.success('Timetable deleted');
      await fetchTimetables();
    } catch (error) {
      message.error('Failed to delete timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTimetable = async () => {
    try {
      await generateTimetable();
      await fetchTimetables();
      message.success('Timetable generated!');
    } catch (error) {
      message.error('Failed to generate timetable');
    }
  };

  const timetableColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: any) => {
        const sessionCount = record.sessions?.length || 0
        if (sessionCount > 0) {
          return <Tag color="green">Generated ({sessionCount} sessions)</Tag>
        } else {
          return <Tag color="orange">Not Generated</Tag>
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Tooltip title="View Timetable">
            <Button 
              icon={<EyeOutlined />} 
              size="small"
              onClick={() => viewTimetable(record.id)}
            />
          </Tooltip>
          <Tooltip title="Generate Timetable">
            <Button 
              type="primary"
              icon={<PlayCircleOutlined />} 
              size="small"
              loading={generating}
              onClick={() => generateTimetableForId(record.id)}
            />
          </Tooltip>
          <Tooltip title="Reschedule">
            <Button 
              icon={<SyncOutlined />} 
              size="small"
              loading={generating}
              onClick={() => rescheduleTimetableForId(record.id)}
            />
          </Tooltip>
          <Tooltip title="Optimize">
            <Button 
              icon={<ClearOutlined />} 
              size="small"
              loading={generating}
              onClick={() => optimizeTimetableForId(record.id)}
            />
          </Tooltip>
          <Tooltip title="Sync Calendar">
            <Button 
              icon={<CalendarOutlined />} 
              size="small"
              loading={generating}
              onClick={() => syncToCalendar(record.id)}
            />
          </Tooltip>
          <Tooltip title="Export PDF">
            <Button 
              icon={<DownloadOutlined />} 
              size="small"
              onClick={() => downloadTimetablePDF(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to clear this timetable?"
            onConfirm={() => clearTimetableForId(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Clear Timetable">
              <Button 
                danger
                icon={<ClearOutlined />} 
                size="small"
                loading={generating}
              />
            </Tooltip>
          </Popconfirm>
          <Popconfirm
            title="Are you sure you want to delete this timetable?"
            onConfirm={() => handleDeleteTimetable(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small" loading={loading}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const renderTimetableGrid = () => {
    const sections = Object.keys(timetableData)
    
    if (sections.length === 0) {
      return <Alert message="No timetable data available" type="info" />
    }
    
    return sections.map(section => (
      <div key={section} style={{ marginBottom: '32px' }}>
        <Title level={4}>Section {section}</Title>
        <div style={{ overflow: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', border: '1px solid #d9d9d9' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th style={{ border: '1px solid #d9d9d9', padding: '8px', width: '100px' }}>Time</th>
                {days.map(day => (
                  <th key={day} style={{ border: '1px solid #d9d9d9', padding: '8px', minWidth: '150px' }}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot}>
                  <td style={{ border: '1px solid #d9d9d9', padding: '8px', fontWeight: 'bold' }}>
                    {timeSlot}
                  </td>
                  {days.map((day, dayIndex) => {
                    const dayData = timetableData[section]?.[dayIndex] || []
                    const session = dayData.find(s => 
                      `${s.start_time}-${s.end_time}` === timeSlot ||
                      (s.start_time <= timeSlot.split('-')[0] && s.end_time > timeSlot.split('-')[0])
                    )
                    
                    return (
                      <td key={day} style={{ border: '1px solid #d9d9d9', padding: '4px', height: '60px' }}>
                        {session ? (
                          <div 
                            style={{ 
                              backgroundColor: session.color,
                              color: 'white',
                              padding: '4px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center'
                            }}
                          >
                            <div style={{ fontWeight: 'bold' }}>{session.course_code}</div>
                            <div>{session.instructor}</div>
                            <div>{session.room}</div>
                            <div style={{ fontSize: '10px' }}>{session.type}</div>
                          </div>
                        ) : (
                          <div style={{ height: '100%', backgroundColor: '#fafafa' }} />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ))
  }

  const renderConflictsTab = () => {
    if (conflicts.length === 0) {
      return (
        <Alert
          message="No Conflicts Found"
          description="The timetable has no scheduling conflicts."
          type="success"
          icon={<CheckCircleOutlined />}
        />
      )
    }

    return (
      <List
        dataSource={conflicts}
        renderItem={(conflict, index) => (
          <List.Item>
            <List.Item.Meta
              avatar={<WarningOutlined style={{ color: '#ff4d4f' }} />}
              title={
                <Space>
                  <Tag color="red">{conflict.type.replace('_', ' ').toUpperCase()}</Tag>
                  {conflict.instructor && <Text>Instructor: {conflict.instructor}</Text>}
                  {conflict.room && <Text>Room: {conflict.room}</Text>}
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text>Day: {conflict.day} at {conflict.time}</Text>
                  <Text>Courses: {conflict.courses.join(', ')}</Text>
                  {conflict.break_time && <Text>Issue: {conflict.break_time}</Text>}
                </Space>
              }
            />
          </List.Item>
        )}
      />
    )
  }

  const renderStatisticsTab = () => {
    if (!statistics) {
      return <Alert message="No statistics available" type="info" />
    }

    return (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Sessions" value={statistics.total_sessions} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Sections" value={statistics.sections} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Courses" value={statistics.courses} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Instructors" value={statistics.instructors} />
            </Card>
          </Col>
        </Row>

        <Card title="Session Breakdown">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic title="Lectures" value={statistics.session_breakdown?.lectures || 0} />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic title="Tutorials" value={statistics.session_breakdown?.tutorials || 0} />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic title="Practicals" value={statistics.session_breakdown?.practicals || 0} />
            </Col>
          </Row>
        </Card>

        <Card title="Daily Distribution">
          <Row gutter={[16, 16]}>
            {days.map((day, index) => (
              <Col xs={24} sm={8} lg={4} key={day}>
                <Statistic 
                  title={day} 
                  value={statistics.daily_distribution?.[index] || 0}
                  valueStyle={{ fontSize: '16px' }}
                />
              </Col>
            ))}
          </Row>
        </Card>
      </Space>
    )
  }

  return (
    <div>
      <Title level={2}>Timetable Management</Title>
      <Text type="secondary">Create and manage class timetables with comprehensive scheduling features</Text>

      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginTop: '24px' }}>
        <TabPane tab="Timetable List" key="list">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card title="Create New Timetable">
              <Form form={form} layout="inline" onFinish={createNewTimetable}>
                <Form.Item 
                  name="name" 
                  label="Timetable Name"
                  rules={[{ required: true, message: 'Please enter timetable name' }]}
                >
                  <Input placeholder="e.g., Spring 2024 Semester" style={{ width: 300 }} />
                </Form.Item>
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    icon={<PlusOutlined />}
                    loading={loading}
                  >
                    Create Timetable
                  </Button>
                </Form.Item>
              </Form>
            </Card>

            <Card title="Existing Timetables">
              <Table
                columns={timetableColumns}
                dataSource={timetables}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          </Space>
        </TabPane>
      </Tabs>

      <Modal
        title={
          <Space>
            <CalendarOutlined />
            Timetable Details
            {conflicts.length > 0 && <Badge count={conflicts.length} color="red" />}
          </Space>
        }
        open={showTimetableModal}
        onCancel={() => setShowTimetableModal(false)}
        footer={null}
        width="95%"
        style={{ top: 20 }}
      >
        <Tabs defaultActiveKey="grid">
          <TabPane tab="Timetable Grid" key="grid">
            <Spin spinning={Object.keys(timetableData).length === 0}>
              {renderTimetableGrid()}
            </Spin>
          </TabPane>
          <TabPane tab="Conflicts" key="conflicts">
            {renderConflictsTab()}
          </TabPane>
          <TabPane tab="Statistics" key="statistics">
            {renderStatisticsTab()}
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  )
}

export default TimetablePage