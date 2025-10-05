// import React, { useState } from 'react'
// import { Layout, Menu, Typography, Space, Button } from 'antd'
// import { 
//   UploadOutlined, 
//   CalendarOutlined, 
//   BookOutlined, 
//   DashboardOutlined,
//   UserOutlined,
//   SettingOutlined,
//   MenuFoldOutlined,
//   MenuUnfoldOutlined
// } from '@ant-design/icons'
// import { Routes, Route, Link, useLocation } from 'react-router-dom'

// // Replace actual imports with simple components for testing
// const Dashboard = () => <div>Dashboard Page</div>
// const UploadPage = () => <div>Upload Page</div>
// const TimetablePage = () => <div>Timetable Page</div>
// const ExamsPage = () => <div>Exams Page</div>
// const AvailabilityPage = () => <div>Availability Page</div>
// const SettingsPage = () => <div>Settings Page</div>
// const NotFound = () => <div>404 - Page Not Found</div>

// // Error Boundary to catch rendering errors
// class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
//   constructor(props: any) {
//     super(props)
//     this.state = { hasError: false }
//   }
//   static getDerivedStateFromError(_: Error) {
//     return { hasError: true }
//   }
//   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
//     // Optionally log error
//     console.error('ErrorBoundary caught:', error, errorInfo)
//   }
//   render() {
//     if (this.state.hasError) {
//       return (
//         <div style={{ color: 'red', textAlign: 'center', padding: 40 }}>
//           Something went wrong. Please refresh the page.
//         </div>
//       )
//     }
//     return this.props.children
//   }
// }

// const { Header, Sider, Content } = Layout
// const { Title } = Typography

// const menuItems = [
//   {
//     key: '/',
//     icon: <DashboardOutlined />,
//     label: <Link to="/">Dashboard</Link>,
//   },
//   {
//     key: '/upload',
//     icon: <UploadOutlined />,
//     label: <Link to="/upload">Data Import</Link>,
//   },
//   {
//     key: '/timetable',
//     icon: <CalendarOutlined />,
//     label: <Link to="/timetable">Timetable</Link>,
//   },
//   {
//     key: '/availability',
//     icon: <UserOutlined />,
//     label: <Link to="/availability">Availability</Link>,
//   },
//   {
//     key: '/exams',
//     icon: <BookOutlined />,
//     label: <Link to="/exams">Exams</Link>,
//   },
//   {
//     key: '/settings',
//     icon: <SettingOutlined />,
//     label: <Link to="/settings">Settings</Link>,
//   },
// ]

// const App: React.FC = () => {
//   const [collapsed, setCollapsed] = useState(false)
//   const location = useLocation()

//   const selectedKey = menuItems.some(item => item.key === location.pathname)
//     ? location.pathname
//     : '/'

//   return (
//     <Layout style={{ minHeight: '100vh' }}>
//       <Sider 
//         trigger={null} 
//         collapsible 
//         collapsed={collapsed}
//         style={{
//           background: '#fff',
//           boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
//         }}
//       >
//         <div style={{ 
//           padding: '16px', 
//           textAlign: 'center',
//           borderBottom: '1px solid #f0f0f0',
//           marginBottom: '16px'
//         }}>
//           <Title level={collapsed ? 5 : 4} style={{ margin: 0, color: '#1890ff' }}>
//             {collapsed ? 'TA' : 'Timetable Automation'}
//           </Title>
//         </div>
//         <Menu
//           mode="inline"
//           selectedKeys={[selectedKey]}
//           items={menuItems}
//           style={{ border: 'none' }}
//         />
//       </Sider>
      
//       <Layout>
//         <Header style={{ 
//           padding: '0 24px', 
//           background: '#fff', 
//           boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between'
//         }}>
//           <Button
//             type="text"
//             icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
//             onClick={() => setCollapsed(!collapsed)}
//             style={{
//               fontSize: '16px',
//               width: 64,
//               height: 64,
//             }}
//           />
//           <Space>
//             <Typography.Text strong>Welcome to Timetable Automation System</Typography.Text>
//           </Space>
//         </Header>
        
//         <Content style={{ 
//           margin: '24px 16px', 
//           padding: '24px', 
//           background: '#f5f5f5',
//           minHeight: 'calc(100vh - 112px)',
//           borderRadius: '8px'
//         }}>
//           <ErrorBoundary>
//             <Routes>
//               <Route path="/" element={<Dashboard />} />
//               <Route path="/upload" element={<UploadPage />} />
//               <Route path="/timetable" element={<TimetablePage />} />
//               <Route path="/availability" element={<AvailabilityPage />} />
//               <Route path="/exams" element={<ExamsPage />} />
//               <Route path="/settings" element={<SettingsPage />} />
//               <Route path="*" element={<NotFound />} />
//             </Routes>
//           </ErrorBoundary>
//         </Content>
//       </Layout>
//     </Layout>
//   )
// }

// export default App


import React, { useState } from 'react'
import { Layout, Menu, Typography, Space, Button } from 'antd'
import { 
  UploadOutlined, 
  CalendarOutlined, 
  BookOutlined, 
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import UploadPage from './pages/UploadPage'
import TimetablePage from './pages/TimetablePage'
import ExamsPage from './pages/ExamsPage'
import AvailabilityPage from './pages/AvailabilityPage'
import SettingsPage from './pages/SettingsPage'

const NotFound = () => <div>404 - Page Not Found</div>

// Error Boundary to catch rendering errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError(_: Error) {
    return { hasError: true }
  }
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Optionally log error
    console.error('ErrorBoundary caught:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ color: 'red', textAlign: 'center', padding: 40 }}>
          Something went wrong. Please refresh the page.
        </div>
      )
    }
    return this.props.children
  }
}

const { Header, Sider, Content } = Layout
const { Title } = Typography

const menuItems = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: <Link to="/">Dashboard</Link>,
  },
  {
    key: '/upload',
    icon: <UploadOutlined />,
    label: <Link to="/upload">Data Import</Link>,
  },
  {
    key: '/timetable',
    icon: <CalendarOutlined />,
    label: <Link to="/timetable">Timetable</Link>,
  },
  {
    key: '/availability',
    icon: <UserOutlined />,
    label: <Link to="/availability">Availability</Link>,
  },
  {
    key: '/exams',
    icon: <BookOutlined />,
    label: <Link to="/exams">Exams</Link>,
  },
  {
    key: '/settings',
    icon: <SettingOutlined />,
    label: <Link to="/settings">Settings</Link>,
  },
]

const App: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  const selectedKey = menuItems.some(item => item.key === location.pathname)
    ? location.pathname
    : '/'

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#fff',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ 
          padding: '16px', 
          textAlign: 'center',
          borderBottom: '1px solid #f0f0f0',
          marginBottom: '16px'
        }}>
          <Title level={collapsed ? 5 : 4} style={{ margin: 0, color: '#1890ff' }}>
            {collapsed ? 'TA' : 'Timetable Automation'}
          </Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ border: 'none' }}
        />
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Space>
            <Typography.Text strong>Welcome to Timetable Automation System</Typography.Text>
          </Space>
        </Header>
        
        <Content style={{ 
          margin: '24px 16px', 
          padding: '24px', 
          background: '#f5f5f5',
          minHeight: 'calc(100vh - 112px)',
          borderRadius: '8px'
        }}>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/availability" element={<AvailabilityPage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  )
}

export default App