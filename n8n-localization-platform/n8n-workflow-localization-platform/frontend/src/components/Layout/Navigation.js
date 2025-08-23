import React from 'react';
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Divider,
  Typography,
  Box
} from '@mui/material';
import { 
  Home as HomeIcon,
  CloudUpload as UploadIcon,
  Translate as TranslateIcon,
  Package as PackageIcon,
  Search as SearchIcon,
  AccountCircle as ProfileIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const Navigation = ({ onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleNavigation = (path) => {
    navigate(path);
    if (onClose) onClose();
  };

  const publicNavItems = [
    { text: 'ホーム', icon: <HomeIcon />, path: '/' },
    { text: 'パッケージ検索', icon: <SearchIcon />, path: '/packages' },
  ];

  const privateNavItems = [
    { text: 'ワークフロー', icon: <UploadIcon />, path: '/workflows' },
    { text: 'マイパッケージ', icon: <PackageIcon />, path: '/my-packages' },
    { text: 'プロフィール', icon: <ProfileIcon />, path: '/profile' },
  ];

  return (
    <Box sx={{ p: 2 }}>
      <List>
        {publicNavItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === item.path ? 'white' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {isAuthenticated && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="overline" sx={{ px: 2, color: 'text.secondary' }}>
            マイアカウント
          </Typography>
          <List>
            {privateNavItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.light',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: location.pathname === item.path ? 'white' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      )}
    </Box>
  );
};

export default Navigation;