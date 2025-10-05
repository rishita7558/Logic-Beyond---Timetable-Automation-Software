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
  slots: { uploaded: boolean; count: number }
  professor_availability: { uploaded: boolean; count: number }
  room_availability: { uploaded: boolean; count: number }
}

const UploadPage: React.FC = () => {
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    professors: { uploaded: false, count: 0 },
    students: { uploaded: false, count: 0 },
    rooms: { uploaded: false, count: 0 },
    courses: { uploaded: false, count: 0 },
    slots: { uploaded: false, count: 0 },
    professor_availability: { uploaded: false, count: 0 },
    room_availability: { uploaded: false, count: 0 },
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
        const response = await uploadCSV(endpoint, file as File)
        const count = response.data.created || 0
        
        setUploadStatus(prev => ({
          ...prev,
          [type]: { uploaded: true, count },
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
    const total = Object.keys(uploadStatus).length
    const completed = Object.values(uploadStatus).filter((status) => status.uploaded).length
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
          {completionPercentage}% complete - {Object.values(uploadStatus).filter(s => s.uploaded).length} of {Object.keys(uploadStatus).length} files uploaded
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

        <Card title="Time Slots Data" extra={uploadStatus.slots.uploaded && <CheckCircleOutlined style={{ color: '#52c41a' }} />}>
          <Dragger {...uploadProps('slots', '/csv/slots/')}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {uploading === 'slots' ? 'Uploading...' : 'Click or drag CSV file here to upload time slots'}
            </p>
            <p className="ant-upload-hint">
              CSV should contain: code, day_of_week (0=Mon, 1=Tue), start_time, end_time
            </p>
          </Dragger>
          {uploadStatus.slots.uploaded && (
            <Text type="success" style={{ marginTop: '8px', display: 'block' }}>
              ✓ {uploadStatus.slots.count} slots imported
            </Text>
          )}
        </Card>

        <Card title="Professor Availability Data" extra={uploadStatus.professor_availability.uploaded && <CheckCircleOutlined style={{ color: '#52c41a' }} />}>
          <Dragger {...uploadProps('professor_availability', '/csv/professor-availability/')}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {uploading === 'professor_availability' ? 'Uploading...' : 'Click or drag CSV file here to upload professor availability'}
            </p>
            <p className="ant-upload-hint">
              CSV should contain: professor_email, day_of_week (0=Mon, 1=Tue), start_time, end_time
            </p>
          </Dragger>
          {uploadStatus.professor_availability.uploaded && (
            <Text type="success" style={{ marginTop: '8px', display: 'block' }}>
              ✓ {uploadStatus.professor_availability.count} availability records imported
            </Text>
          )}
        </Card>

        <Card title="Room Availability Data" extra={uploadStatus.room_availability.uploaded && <CheckCircleOutlined style={{ color: '#52c41a' }} />}>
          <Dragger {...uploadProps('room_availability', '/csv/room-availability/')}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {uploading === 'room_availability' ? 'Uploading...' : 'Click or drag CSV file here to upload room availability'}
            </p>
            <p className="ant-upload-hint">
              CSV should contain: room_code, day_of_week (0=Mon, 1=Tue), start_time, end_time
            </p>
          </Dragger>
          {uploadStatus.room_availability.uploaded && (
            <Text type="success" style={{ marginTop: '8px', display: 'block' }}>
              ✓ {uploadStatus.room_availability.count} availability records imported
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

          <div>
            <Text strong>Slots CSV:</Text>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
{`code,day_of_week,start_time,end_time
L1,0,09:00,10:00
L2,0,10:00,11:00`}
            </pre>
          </div>

          <div>
            <Text strong>Professor Availability CSV:</Text>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
{`professor_email,day_of_week,start_time,end_time
john.smith@university.edu,0,08:00,17:00
jane.doe@university.edu,1,09:00,12:00`}
            </pre>
          </div>

          <div>
            <Text strong>Room Availability CSV:</Text>
            <pre style={{ background: '#f5f5f5', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
{`room_code,day_of_week,start_time,end_time
A101,0,08:00,18:00
CS101,1,09:00,16:00`}
            </pre>
          </div>

        </Space>
      </Card>
    </div>
  )
}

export default UploadPage