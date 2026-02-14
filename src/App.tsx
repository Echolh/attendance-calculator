import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import Home from './pages/Home';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <div className="app">
        <Home />
      </div>
    </ConfigProvider>
  );
}

export default App;
