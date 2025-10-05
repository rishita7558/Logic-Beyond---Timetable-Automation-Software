import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Typography, Button, Space, Progress, Alert } from 'antd'
import { 
  UserOutlined, 
  BookOutlined, 
  CalendarOutlined, 
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

const { Title, Text } = Typography

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    professors: 0,
    students: 0,
    courses: 0,
    rooms: 0,
    timetables: 0,
    exams: 0
  })
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const [profResp, studentResp, courseResp, roomResp, timetableResp, examResp] = await Promise.all([
        api.get('/professors/'),
        api.get('/students/'),
        api.get('/courses/'),
        api.get('/rooms/'),
        api.get('/timetables/'),
        api.get('/exams/')
      ])

      setStats({
        professors: profResp.data.count || profResp.data.length || 0,
        students: studentResp.data.count || studentResp.data.length || 0,
        courses: courseResp.data.count || courseResp.data.length || 0,
        rooms: roomResp.data.count || roomResp.data.length || 0,
        timetables: timetableResp.data.count || timetableResp.data.length || 0,
        exams: examResp.data.count || examResp.data.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionPercentage = () => {
    const total = 4 // professors, students, courses, rooms
    const completed = [
      stats.professors > 0,
      stats.students > 0,
      stats.courses > 0,
      stats.rooms > 0
    ].filter(Boolean).length
    
    return Math.round((completed / total) * 100)
  }

  const completionPercentage = getCompletionPercentage()

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Text type="secondary">Welcome to the Timetable Automation System</Text>
      
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Professors"
              value={stats.professors}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Students"
              value={stats.students}
              prefix={<TeamOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Courses"
              value={stats.courses}
              prefix={<BookOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Rooms"
              value={stats.rooms}
              prefix={<CalendarOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={16}>
          <Card title="System Status" extra={<Button onClick={fetchStats}>Refresh</Button>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>Data Import Progress</Text>
                <Progress 
                  percent={completionPercentage} 
                  status={completionPercentage === 100 ? 'success' : 'active'}
                  style={{ marginTop: '8px' }}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {completionPercentage}% complete - {stats.professors} professors, {stats.students} students, {stats.courses} courses, {stats.rooms} rooms
                </Text>
              </div>
              
              {completionPercentage === 100 ? (
                <Alert
                  message="System Ready"
                  description="All required data has been imported. You can now generate timetables and exam schedules."
                  type="success"
                  icon={<CheckCircleOutlined />}
                  action={
                    <Space>
                      <Button size="small" onClick={() => navigate('/timetable')}>
                        Generate Timetable
                      </Button>
                      <Button size="small" onClick={() => navigate('/exams')}>
                        Generate Exams
                      </Button>
                    </Space>
                  }
                />
              ) : (
                <Alert
                  message="Setup Required"
                  description="Please import all required data (professors, students, courses, rooms) before generating timetables."
                  type="warning"
                  icon={<ExclamationCircleOutlined />}
                  action={
                    <Button size="small" onClick={() => navigate('/upload')}>
                      Import Data
                    </Button>
                  }
                />
              )}
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                block 
                onClick={() => navigate('/upload')}
                icon={<UserOutlined />}
              >
                Import Data
              </Button>
              <Button 
                block 
                onClick={() => navigate('/timetable')}
                icon={<CalendarOutlined />}
                disabled={completionPercentage < 100}
              >
                Manage Timetables
              </Button>
              <Button 
                block 
                onClick={() => navigate('/exams')}
                icon={<BookOutlined />}
                disabled={completionPercentage < 100}
              >
                Manage Exams
              </Button>
              <Button 
                block 
                onClick={() => navigate('/settings')}
                icon={<ClockCircleOutlined />}
              >
                Settings
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="Generated Timetables">
            <Statistic
              title="Active Timetables"
              value={stats.timetables}
              suffix="schedules"
            />
            <Button 
              type="link" 
              onClick={() => navigate('/timetable')}
              style={{ padding: 0, marginTop: '8px' }}
            >
              View All Timetables →
            </Button>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Exam Schedule">
            <Statistic
              title="Scheduled Exams"
              value={stats.exams}
              suffix="exams"
            />
            <Button 
              type="link" 
              onClick={() => navigate('/exams')}
              style={{ padding: 0, marginTop: '8px' }}
            >
              View All Exams →
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard

// Example: c:\timetable-automation\frontend\src\pages\UploadPage.tsx
// import { Typography } from 'antd';

// const { Title } = Typography;

export const UploadPage: React.FC = () => (
  <div>
    {/* Add your actual UI here */}
  </div>
);
