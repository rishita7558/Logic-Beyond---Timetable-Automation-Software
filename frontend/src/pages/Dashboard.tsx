import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Space, 
  message, 
  List, 
  Tag, 
  Alert 
} from 'antd';
import { 
  PlayCircleOutlined, 
  CalendarOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { 
  generateTimetable, 
  fetchTimetables, 
  type Timetable 
} from '../services/api';

const { Title, Text } = Typography;

interface DashboardStats {
  totalTimetables: number;
  generatedTimetables: number;
  pendingTimetables: number;
  recentActivity: string[];
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalTimetables: 0,
    generatedTimetables: 0,
    pendingTimetables: 0,
    recentActivity: []
  });
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(true);

  useEffect(() => {
    fetchTimetablesData();
  }, []);

  const fetchTimetablesData = async (): Promise<void> => {
    try {
      const response = await fetchTimetables();
      const fetchedTimetables = response.data;
      setTimetables(fetchedTimetables);
      
      const total = fetchedTimetables.length;
      const generated = fetchedTimetables.filter((t: Timetable) => 
        t.is_generated || (t.sessions && t.sessions.length > 0)
      ).length;
      const pending = total - generated;
      
      setStats({
        totalTimetables: total,
        generatedTimetables: generated,
        pendingTimetables: pending,
        recentActivity: [
          'Timetable "Spring 2024" generated',
          'New timetable "Fall 2024" created',
          'Timetable "Summer 2024" optimized'
        ]
      });
      setBackendOnline(true);
    } catch (error) {
      // Silent fallback to mock data
      const mockTimetables: Timetable[] = [
        { 
          id: 1, 
          name: 'Spring 2024', 
          created_at: new Date().toISOString(), 
          sessions: Array(5),
          session_count: 5,
          is_generated: true
        },
        { 
          id: 2, 
          name: 'Fall 2024', 
          created_at: new Date().toISOString(), 
          sessions: [],
          session_count: 0,
          is_generated: false
        }
      ];
      setTimetables(mockTimetables);
      setStats({
        totalTimetables: 2,
        generatedTimetables: 1,
        pendingTimetables: 1,
        recentActivity: [
          'Timetable "Spring 2024" generated',
          'New timetable "Fall 2024" created'
        ]
      });
      setBackendOnline(false);
    }
  };

  const handleGenerateTimetable = async (): Promise<void> => {
    try {
      setLoading(true);
      const timetableId = timetables.length > 0 ? timetables[0].id : 1;
      await generateTimetable(timetableId);
      await fetchTimetablesData();
      message.success('Timetable generated successfully!');
    } catch (error) {
      message.error('Failed to generate timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (path: string): void => {
    navigate(path);
  };

  const getTimetableStatus = (timetable: Timetable): { status: string; color: string } => {
    const sessionCount = timetable.session_count || timetable.sessions?.length || 0;
    if (sessionCount > 0) {
      return { status: `Generated (${sessionCount} sessions)`, color: 'green' };
    } else {
      return { status: 'Not Generated', color: 'orange' };
    }
  };

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Text type="secondary">Overview of your timetable automation system</Text>

      {!backendOnline && (
        <Alert
          message="Development Mode"
          description="Using mock data for demonstration. Backend server is not available."
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Total Timetables" 
              value={stats.totalTimetables}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Generated" 
              value={stats.generatedTimetables}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Pending" 
              value={stats.pendingTimetables}
              valueStyle={{ color: '#cf1322' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic 
              title="Instructors" 
              value={8}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card 
            title="Quick Actions" 
            extra={
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                loading={loading}
                onClick={handleGenerateTimetable}
              >
                Generate Timetable
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                block 
                size="large"
                onClick={() => handleNavigate('/timetable')}
              >
                Manage Timetables
              </Button>
              <Button 
                block 
                size="large"
                onClick={() => handleNavigate('/upload')}
              >
                Upload Data
              </Button>
              <Button 
                block 
                size="large"
                onClick={() => handleNavigate('/exams')}
              >
                Exam Scheduling
              </Button>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Recent Activity">
            <List
              size="small"
              dataSource={stats.recentActivity}
              renderItem={(item: string, index: number) => (
                <List.Item key={index}>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Timetables" style={{ marginTop: '24px' }}>
        <List
          dataSource={timetables.slice(0, 3)}
          renderItem={(timetable: Timetable) => {
            const { status, color } = getTimetableStatus(timetable);
            return (
              <List.Item
                key={timetable.id}
                actions={[
                  <Button 
                    type="link" 
                    onClick={() => handleNavigate('/timetable')}
                  >
                    View
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={timetable.name}
                  description={
                    <Space>
                      <Text>
                        Created: {new Date(timetable.created_at).toLocaleDateString()}
                      </Text>
                      <Tag color={color}>
                        {status}
                      </Tag>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      </Card>
    </div>
  );
};

export default Dashboard;