import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import App from './App';
import 'antd/dist/reset.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ConfigProvider
    theme={{
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#1890ff',
        borderRadius: 8,
      },
    }}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ConfigProvider>
);
