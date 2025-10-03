
import iqmsLogo from './assets/logo.png';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';
import Profile from './pages/ProfileView/ProfileView';


const iqmsConfig = {
  id: 'iqms',
  name: 'IQMS',
  logo: iqmsLogo,
  theme: {
    primaryColor: '#0056b3',
    secondaryColor: '#ffffff',
  },
  api: {
    baseUrl: 'https://api.iqms.com',
  },
  pages: {
    Login: LoginPage,
    Dashboard: Dashboard,
    Users: Users,
    Settings: Settings,
    Profile: Profile,
  },
  navigation: {
    sidebar: [
      {
        title: 'Dashboard',
        path: '/dashboard',
      },
      {
        title: 'Users',
        path: '/users',
      },
      {
        title: 'Settings',
        path: '/settings',
      },
    ],
    topbar: [
        {
            title: 'Profile',
            path: '/profile',
        }
    ],
  },
};

export default iqmsConfig;
