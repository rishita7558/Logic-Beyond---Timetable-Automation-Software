import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout } from 'antd';
import Dashboard from './pages/Dashboard';
import TimetablePage from './pages/TimetablePage';
import UploadPage from './pages/UploadPage';
import ExamsPage from './pages/ExamsPage';
import './App.css';

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
  return (
    <ConfigProvider>
      <Router future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}>
        <Layout className="App-layout">
          <Header style={{ background: '#001529', color: 'white', padding: '0 20px' }}>
            <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>
              Timetable Automation System
            </div>
          </Header>
          <Content style={{ padding: '20px', minHeight: 'calc(100vh - 64px)' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/exams" element={<ExamsPage />} />
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </Content>
          <Footer style={{ textAlign: 'center' }}>
            Timetable Automation System ©2024
          </Footer>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;