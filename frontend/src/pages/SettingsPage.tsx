import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  TimePicker, 
  Button, 
  message, 
  Space, 
  Typography, 
  Table, 
  Tag, 
  Select,
  Divider,
  Alert
} from 'antd'
import { 
  PlusOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  ClockCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { api } from '../services/api'

const { Title, Text } = Typography
const { Option } = Select

const SettingsPage: React.FC = () => {
  const [slotsForm] = Form.useForm()
  const [messForm] = Form.useForm()
  const [profForm] = Form.useForm()
  const [roomForm] = Form.useForm()
  
  const [slots, setSlots] = useState<any[]>([])
  const [messHours, setMessHours] = useState<any[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const days = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' },
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [slotsResp, messResp, profResp, roomResp] = await Promise.all([
        api.get('/slots/'),
        api.get('/mess-hours/'),
        api.get('/professors/'),
        api.get('/rooms/')
      ])
      
      setSlots(slotsResp.data.results || slotsResp.data || [])
      setMessHours(messResp.data.results || messResp.data || [])
      setProfessors(profResp.data.results || profResp.data || [])
      setRooms(roomResp.data.results || roomResp.data || [])
    } catch (error) {
      message.error('Failed to fetch settings data')
    } finally {
      setLoading(false)
    }
  }

  const createSlot = async (values: any) => {
    try {
      const slotData = {
        code: values.code,
        day_of_week: values.day_of_week,
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss')
      }
      
      await api.post('/slots/', slotData)
      message.success('Time slot created successfully')
      slotsForm.resetFields()
      fetchData()
    } catch (error) {
      message.error('Failed to create time slot')
    }
  }

  const createMessHours = async (values: any) => {
    try {
      const messData = {
        day_of_week: values.day_of_week,
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss')
      }
      
      await api.post('/mess-hours/', messData)
      message.success('Mess hours created successfully')
      messForm.resetFields()
      fetchData()
    } catch (error) {
      message.error('Failed to create mess hours')
    }
  }

  const updateProfessorAvailability = async (profId: number, values: any) => {
    try {
      const availabilityData = {
        professor: profId,
        day_of_week: values.day_of_week,
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss')
      }
      
      await api.post('/professor-availability/', availabilityData)
      message.success('Professor availability updated')
      profForm.resetFields()
      fetchData()
    } catch (error) {
      message.error('Failed to update professor availability')
    }
  }

  const updateRoomAvailability = async (roomId: number, values: any) => {
    try {
      const availabilityData = {
        room: roomId,
        day_of_week: values.day_of_week,
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss')
      }
      
      await api.post('/room-availability/', availabilityData)
      message.success('Room availability updated')
      roomForm.resetFields()
      fetchData()
    } catch (error) {
      message.error('Failed to update room availability')
    }
  }

  const deleteSlot = async (id: number) => {
    try {
      await api.delete(`/slots/${id}/`)
      message.success('Time slot deleted')
      fetchData()
    } catch (error) {
      message.error('Failed to delete time slot')
    }
  }

  const deleteMessHours = async (id: number) => {
    try {
      await api.delete(`/mess-hours/${id}/`)
      message.success('Mess hours deleted')
      fetchData()
    } catch (error) {
      message.error('Failed to delete mess hours')
    }
  }

  const slotColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Day',
      dataIndex: 'day_of_week',
      key: 'day_of_week',
      render: (day: number) => days.find(d => d.value === day)?.label || 'Unknown',
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Button 
          danger 
          size="small" 
          icon={<DeleteOutlined />}
          onClick={() => deleteSlot(record.id)}
        >
          Delete
        </Button>
      ),
    },
  ]

  const messColumns = [
    {
      title: 'Day',
      dataIndex: 'day_of_week',
      key: 'day_of_week',
      render: (day: number) => days.find(d => d.value === day)?.label || 'Unknown',
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Button 
          danger 
          size="small" 
          icon={<DeleteOutlined />}
          onClick={() => deleteMessHours(record.id)}
        >
          Delete
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Title level={2}>System Settings</Title>
      <Text type="secondary">Configure time slots, mess hours, and availability</Text>

      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '24px' }}>
        <Card title="Time Slots" extra={<ClockCircleOutlined />}>
          <Form form={slotsForm} layout="inline" onFinish={createSlot}>
            <Form.Item 
              name="code" 
              label="Slot Code"
              rules={[{ required: true, message: 'Please enter slot code' }]}
            >
              <Input placeholder="e.g., L1, L2, P1" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item 
              name="day_of_week" 
              label="Day"
              rules={[{ required: true, message: 'Please select day' }]}
            >
              <Select placeholder="Select day" style={{ width: 120 }}>
                {days.map(day => (
                  <Option key={day.value} value={day.value}>{day.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              name="start_time" 
              label="Start Time"
              rules={[{ required: true, message: 'Please select start time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item 
              name="end_time" 
              label="End Time"
              rules={[{ required: true, message: 'Please select end time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Add Slot
              </Button>
            </Form.Item>
          </Form>
          
          <Divider />
          
          <Table
            columns={slotColumns}
            dataSource={slots}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="Mess Hours" extra={<CalendarOutlined />}>
          <Form form={messForm} layout="inline" onFinish={createMessHours}>
            <Form.Item 
              name="day_of_week" 
              label="Day"
              rules={[{ required: true, message: 'Please select day' }]}
            >
              <Select placeholder="Select day" style={{ width: 120 }}>
                {days.map(day => (
                  <Option key={day.value} value={day.value}>{day.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              name="start_time" 
              label="Start Time"
              rules={[{ required: true, message: 'Please select start time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item 
              name="end_time" 
              label="End Time"
              rules={[{ required: true, message: 'Please select end time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Add Mess Hours
              </Button>
            </Form.Item>
          </Form>
          
          <Divider />
          
          <Table
            columns={messColumns}
            dataSource={messHours}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        <Card title="Professor Availability">
          <Alert
            message="Configure when professors are available for classes"
            description="Add availability windows for each professor to ensure proper scheduling."
            type="info"
            style={{ marginBottom: '16px' }}
          />
          
          <Form form={profForm} layout="inline" onFinish={(values) => {
            const profId = values.professor
            updateProfessorAvailability(profId, values)
          }}>
            <Form.Item 
              name="professor" 
              label="Professor"
              rules={[{ required: true, message: 'Please select professor' }]}
            >
              <Select placeholder="Select professor" style={{ width: 200 }}>
                {professors.map(prof => (
                  <Option key={prof.id} value={prof.id}>{prof.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              name="day_of_week" 
              label="Day"
              rules={[{ required: true, message: 'Please select day' }]}
            >
              <Select placeholder="Select day" style={{ width: 120 }}>
                {days.map(day => (
                  <Option key={day.value} value={day.value}>{day.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              name="start_time" 
              label="Available From"
              rules={[{ required: true, message: 'Please select start time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item 
              name="end_time" 
              label="Available Until"
              rules={[{ required: true, message: 'Please select end time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Availability
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Room Availability">
          <Alert
            message="Configure when rooms are available for classes"
            description="Add availability windows for each room to ensure proper scheduling."
            type="info"
            style={{ marginBottom: '16px' }}
          />
          
          <Form form={roomForm} layout="inline" onFinish={(values) => {
            const roomId = values.room
            updateRoomAvailability(roomId, values)
          }}>
            <Form.Item 
              name="room" 
              label="Room"
              rules={[{ required: true, message: 'Please select room' }]}
            >
              <Select placeholder="Select room" style={{ width: 200 }}>
                {rooms.map(room => (
                  <Option key={room.id} value={room.id}>{room.code} - {room.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              name="day_of_week" 
              label="Day"
              rules={[{ required: true, message: 'Please select day' }]}
            >
              <Select placeholder="Select day" style={{ width: 120 }}>
                {days.map(day => (
                  <Option key={day.value} value={day.value}>{day.label}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item 
              name="start_time" 
              label="Available From"
              rules={[{ required: true, message: 'Please select start time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item 
              name="end_time" 
              label="Available Until"
              rules={[{ required: true, message: 'Please select end time' }]}
            >
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Availability
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  )
}

export default SettingsPage
