import React, { useState } from 'react';
import { Typography, Form, Select, Tabs } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

const AvailabilityPage: React.FC = () => {
  const [slotsForm] = Form.useForm();
  const [messForm] = Form.useForm();
  const [profForm] = Form.useForm();
  const [roomForm] = Form.useForm();
  const [slots, setSlots] = useState<any[]>([]);
  const [messHours, setMessHours] = useState<any[]>([]);

  return (
    <div>
      <Title level={3}>Availability Page</Title>
      {/* Add your actual UI here */}
    </div>
  );
};

export default AvailabilityPage;
