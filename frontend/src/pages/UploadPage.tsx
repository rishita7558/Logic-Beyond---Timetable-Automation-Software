import React, { useState } from 'react'
import { Card, Upload, Button, message, Progress, Typography, Space, Alert, Divider } from 'antd'
import { InboxOutlined, UploadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { uploadCSV } from '../services/api'

const { Dragger } = Upload
const { Title, Text } = Typography

interface UploadStatus {
  professors: { uploaded: boolean; count: number }
  students: { uploaded: boolean; count: number }
  rooms: { uploaded: boolean; count: number }
  courses: { uploaded: boolean; count: number }
}

const UploadPage: React.FC = () => {
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    professors: { uploaded: false, count: 0 },
    students: { uploaded: false, count: 0 },
    rooms: { uploaded: false, count: 0 },
    courses: { uploaded: false, count: 0 }
  })

  const uploadProps = (type: keyof UploadStatus, endpoint: string) => ({
    name: 'file',
    multiple: false,
    accept: '.csv',
    showUploadList: false,
    disabled: uploading !== null,
    customRequest: async ({ file, onSuccess, onError }: any) => {
      try {
        setUploading(type)
        const response = await uploadCSV('/csv/professors/', file as File)
        const count = response.data.created || 0
        
        setUploadStatus(prev => ({
          ...prev,
          [type]: { uploaded: true, count }
        }))
        
        message.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully (${count} records)`)
        onSuccess?.('ok')
      } catch (e: any) {
        message.error(e?.response?.data?.detail || `Failed to upload ${type}`)
        onError?.(e)
      } finally {
        setUploading(null)
      }
    },
  })

  const getCompletionPercentage = () => {
    const total = 4
    const completed = Object.values(uploadStatus).filter(status => status.uploaded).length
    return Math.round((completed / total) * 100)
  }

  const completionPercentage = getCompletionPercentage()

  return (
    <div>
      <Title level={2}>Data Import</Title>
      <Text type="secondary">Upload CSV files to populate the system with required data</Text>

      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>Import Progress</Title>
        <Progress 
          percent={completionPercentage} 
          status={completionPercentage === 100 ? 'success' : 'active'}
          style={{ marginBottom: '16px' }}
        />
        <Text type="secondary">
          {completionPercentage}% complete - {Object.values(uploadStatus).filter(s => s.uploaded).length} of 4 files uploaded
        </Text>
        
        {completionPercentage === 100 && (
          <Alert
            message="All data imported successfully!"
            description="You can now proceed to generate timetables and exam schedules."
            type="success"
            icon={<CheckCircleOutlined />}
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>

      <Space direction="vertical" size="large" style={{ width: '100%', marginTop: '24px' }}>
        <Card title="Professors Data" extra={uploadStatus.professors.uploaded && <CheckCircleOutlined style={{ color: '#52c41a' }} />}>
          <Dragger {...uploadProps('professors', '/csv/professors/')}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {uploading === 'professors' ? 'Uploading...' : 'Click or drag CSV file here to upload professors'}
            </p>
            <p className="ant-upload-hint">
              CSV should contain: name, email, department
            </p>
          </Dragger>
          {uploadStatus.professors.uploaded && (
            <Text type="success" style={{ marginTop: '8px', display: 'block' }}>
              ✓ {uploadStatus.professors.count} professors imported
            </Text>
          )}
        </Card>

        <Card title="Students Data" extra={uploadStatus.students.uploaded && <CheckCircleOutlined style={{ color: '#52c41a' }} />}>
          <Dragger {...uploadProps('students', '/csv/students/')}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {uploading === 'students' ? 'Uploading...' : 'Click or drag CSV file here to upload students'}
            </p>
            <p className="ant-upload-hint">
              CSV should contain: roll_number, name, program, batch, section
            </p>
          </Dragger>
          {uploadStatus.students.uploaded && (
            <Text type="success" style={{ marginTop: '8px', display: 'block' }}>
              ✓ {uploadStatus.students.count} students imported
            </Text>
          )}
        </Card>

        <Card title="Rooms Data" extra={uploadStatus.rooms.uploaded && <CheckCircleOutlined style={{ color: '#52c41a' }} />}>
          <Dragger {...uploadProps('rooms', '/csv/rooms/')}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {uploading === 'rooms' ? 'Uploading...' : 'Click or drag CSV file here to upload rooms'}
            </p>
            <p className="ant-upload-hint">
              CSV should contain: code, name, building, capacity, room_type (CLASSROOM/LAB/HALL)
            </p>
          </Dragger>
          {uploadStatus.rooms.uploaded && (
            <Text type="success" style={{ marginTop: '8px', display: 'block' }}>
              ✓ {uploadStatus.rooms.count} rooms imported
            </Text>
          )}
        </Card>

        <Card title="Courses Data" extra={uploadStatus.courses.uploaded && <CheckCircleOutlined style={{ color: '#52c41a' }} />}>
          <Dragger {...uploadProps('courses', '/csv/courses/')}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {uploading === 'courses' ? 'Uploading...' : 'Click or drag CSV file here to upload courses'}
            </p>
            <p className="ant-upload-hint">
              CSV should contain: code, name, lecture_hours, tutorial_hours, practical_hours, self_study_hours, credits, instructors
            </p>
          </Dragger>
          {uploadStatus.courses.uploaded && (
            <Text type="success" style={{ marginTop: '8px', display: 'block' }}>
              ✓ {uploadStatus.courses.count} courses imported
            </Text>
          )}
        </Card>
      </Space>

      <Card style={{ marginTop: '24px' }}>
        <Title level={4}>CSV Format Examples</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>Professors CSV:</Text>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
{`name,email,department
Dr. John Smith,john.smith@university.edu,Computer Science
Dr. Jane Doe,jane.doe@university.edu,Mathematics`}
            </pre>
          </div>
          
          <div>
            <Text strong>Students CSV:</Text>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
{`roll_number,name,program,batch,section
2024001,Alice Johnson,Computer Science,2024,A
2024002,Bob Wilson,Computer Science,2024,B`}
            </pre>
          </div>
          
          <div>
            <Text strong>Rooms CSV:</Text>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
{`code,name,building,capacity,room_type
CS101,Computer Lab 1,CS Building,30,LAB
A101,Lecture Hall A,Main Building,100,CLASSROOM`}
            </pre>
          </div>
          
          <div>
            <Text strong>Courses CSV:</Text>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
{`code,name,lecture_hours,tutorial_hours,practical_hours,self_study_hours,credits,instructors
CS101,Programming Fundamentals,3,1,2,2,4,john.smith@university.edu
MATH101,Calculus I,3,1,0,3,4,jane.doe@university.edu`}
            </pre>
          </div>
        </Space>
      </Card>
    </div>
  )
}

export default UploadPage