import React from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

const Dashboard = () => {
  return (
    <div>
      <h2>Dashboard</h2>
      <Card title="Welcome!">
        <p>This is your dashboard. You can see an overview of your application here.</p>
        <Button onClick={() => alert('Button clicked!')}>Click Me</Button>
      </Card>
      <Card title="Statistics">
        <p>Some stats would go here.</p>
      </Card>
    </div>
  );
};

export default Dashboard;
