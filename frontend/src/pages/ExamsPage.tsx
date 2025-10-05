import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Button, 
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
  Statistic,
  Divider
} from 'antd'
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  DownloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons'
import { 
  generateExams, 
  generateSeating, 
  seatingPdfUrl,
  api
} from '../services/api'

const { Title, Text } = Typography
const { Option } = Select

const ExamsPage: React.FC = () => {
  const [exams, setExams] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [seatingData, setSeatingData] = useState<any>({})
  const [showSeatingModal, setShowSeatingModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState<number | null>(null)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      setLoading(true)
      const response = await api.get('/exams/')
      setExams(response.data.results || response.data || [])
    } catch (error) {
      message.error('Failed to fetch exams')
    } finally {
      setLoading(false)
    }
  }

  const generateExamSchedule = async () => {
    try {
      setGenerating(true)
      const response = await generateExams()
      message.success(`Generated ${response.data.created_exams} exam schedules`)
      fetchExams()
    } catch (error: any) {
      message.error('Failed to generate exam schedule')
    } finally {
      setGenerating(false)
    }
  }

  const generateSeatingForExam = async (examId: number) => {
    try {
      setGenerating(true)
      const response = await generateSeating(examId)
      message.success(`Generated seating for ${response.data.seated} students`)
      fetchExams()
    } catch (error: any) {
      message.error('Failed to generate seating arrangement')
    } finally {
      setGenerating(false)
    }
  }

  const downloadSeatingPDF = (examId: number) => {
    const url = seatingPdfUrl(examId)
    window.open(url, '_blank')
  }

  const viewSeatingArrangement = async (examId: number) => {
    try {
      setSelectedExam(examId)
      const response = await api.get(`/seating-assignments/?exam=${examId}`)
      setSeatingData(response.data.results || response.data || [])
      setShowSeatingModal(true)
    } catch (error) {
      message.error('Failed to fetch seating arrangement')
    }
  }

  const examColumns = [
    {
      title: 'Course',
      key: 'course',
      render: (record: any) => (
        <div>
          <Text strong>{record.course?.code}</Text>
          <br />
          <Text type="secondary">{record.course?.name}</Text>
        </div>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Time',
      key: 'time',
      render: (record: any) => (
        <Text>{record.start_time} - {record.end_time}</Text>
      ),
    },
    {
      title: 'Rooms',
      key: 'rooms',
      render: (record: any) => {
        const roomCount = record.room_allocations?.length || 0
        return <Tag color="blue">{roomCount} room(s)</Tag>
      },
    },
    {
      title: 'Students',
      key: 'students',
      render: (record: any) => {
        const totalCapacity = record.room_allocations?.reduce((sum: number, alloc: any) => sum + alloc.capacity_used, 0) || 0
        return <Tag color="green">{totalCapacity} students</Tag>
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: any) => {
        const seatingCount = record.seating_assignments?.length || 0
        const totalCapacity = record.room_allocations?.reduce((sum: number, alloc: any) => sum + alloc.capacity_used, 0) || 0
        
        if (seatingCount === 0) {
          return <Tag color="orange">No Seating</Tag>
        } else if (seatingCount === totalCapacity) {
          return <Tag color="green">Complete</Tag>
        } else {
          return <Tag color="blue">Partial ({seatingCount}/{totalCapacity})</Tag>
        }
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: any) => (
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => viewSeatingArrangement(record.id)}
          >
            View Seating
          </Button>
          <Button 
            type="primary"
            icon={<PlayCircleOutlined />} 
            size="small"
            loading={generating}
            onClick={() => generateSeatingForExam(record.id)}
          >
            Generate Seating
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            size="small"
            onClick={() => downloadSeatingPDF(record.id)}
          >
            PDF
          </Button>
        </Space>
      ),
    },
  ]

  const renderSeatingGrid = () => {
    if (!seatingData.length) {
      return <Alert message="No seating arrangement available" type="info" />
    }

    // Group seating by room
    const roomsData: { [roomId: number]: any[] } = {}
    seatingData.forEach((assignment: any) => {
      const roomId = assignment.room
      if (!roomsData[roomId]) {
        roomsData[roomId] = []
      }
      roomsData[roomId].push(assignment)
    })

    return Object.entries(roomsData).map(([roomId, assignments]) => {
      // Get room info
      const room = assignments[0]?.room_details
      const maxRow = Math.max(...assignments.map((a: any) => a.row_index))
      const maxCol = Math.max(...assignments.map((a: any) => a.col_index))

      // Create grid
      const grid = Array(maxRow + 1).fill(null).map(() => Array(maxCol + 1).fill(null))
      
      assignments.forEach((assignment: any) => {
        grid[assignment.row_index][assignment.col_index] = assignment
      })

      return (
        <Card key={roomId} title={`Room: ${room?.code || roomId} (${room?.capacity || 0} capacity)`} style={{ marginBottom: '16px' }}>
          <div style={{ overflow: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
              <tbody>
                {grid.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((assignment, colIndex) => (
                      <td
                        key={colIndex}
                        style={{
                          border: '1px solid #d9d9d9',
                          padding: '8px',
                          textAlign: 'center',
                          minWidth: '80px',
                          height: '40px',
                          backgroundColor: assignment ? '#f0f8ff' : '#fafafa'
                        }}
                      >
                        {assignment ? (
                          <div style={{ fontSize: '12px' }}>
                            <div style={{ fontWeight: 'bold' }}>{assignment.student?.roll_number}</div>
                            <div>{assignment.student?.name}</div>
                          </div>
                        ) : (
                          <span style={{ color: '#bfbfbf' }}>-</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )
    })
  }

  const getStats = () => {
    const totalExams = exams.length
    const totalRooms = exams.reduce((sum, exam) => sum + (exam.room_allocations?.length || 0), 0)
    const totalStudents = exams.reduce((sum, exam) => 
      sum + (exam.room_allocations?.reduce((roomSum: number, alloc: any) => roomSum + alloc.capacity_used, 0) || 0), 0)
    const totalSeated = exams.reduce((sum, exam) => sum + (exam.seating_assignments?.length || 0), 0)

    return { totalExams, totalRooms, totalStudents, totalSeated }
  }

  const stats = getStats()

  return (
    <div>
      <Title level={2}>Exam Management</Title>
      <Text type="secondary">Generate exam schedules and seating arrangements</Text>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Exams"
              value={stats.totalExams}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rooms Used"
              value={stats.totalRooms}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Students Scheduled"
              value={stats.totalStudents}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Seating Arranged"
              value={stats.totalSeated}
              prefix={<PlayCircleOutlined />}
              suffix={`/ ${stats.totalStudents}`}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={4} style={{ margin: 0 }}>Exam Schedule</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            loading={generating}
            onClick={generateExamSchedule}
          >
            Generate Exam Schedule
          </Button>
        </div>
        
        <Alert
          message="Exam Generation"
          description="Click 'Generate Exam Schedule' to create exam timetables with no clashes for the same batch. The system will automatically allocate rooms based on capacity and ensure proper spacing between exams."
          type="info"
          style={{ marginBottom: '16px' }}
        />

        <Table
          columns={examColumns}
          dataSource={exams}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Seating Arrangement"
        open={showSeatingModal}
        onCancel={() => setShowSeatingModal(false)}
        footer={null}
        width="90%"
        style={{ top: 20 }}
      >
        <Spin spinning={!seatingData.length}>
          {renderSeatingGrid()}
        </Spin>
      </Modal>
    </div>
  )
}

export default ExamsPage