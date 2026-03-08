# Child Safety Monitor - Frontend Documentation

## Overview

The React frontend is a modern, responsive web application built with React 18, Tailwind CSS, and Recharts. It provides intuitive dashboards for both parents and children to manage online safety.

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Routing**: React Router v6

## Project Structure

```
frontend/
├── src/
│   ├── pages/              # Page components
│   ├── components/         # Reusable components
│   ├── store/             # Zustand stores
│   ├── services/          # API & WebSocket services
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Helper functions
│   ├── App.jsx            # Root component
│   ├── main.jsx           # Entry point
│   └── index.css           # Global styles
├── public/
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

## Installation & Setup

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3000`

### Build for Production

```bash
npm run build
```

Output in `dist/` directory

### Preview Production Build

```bash
npm run preview
```

## Key Features

### Pages

1. **LoginPage** (`/login`)
   - Email and password authentication
   - Remember me functionality
   - Error handling

2. **RegisterPage** (`/register`)
   - Parent and child registration
   - Role-based signup
   - Age group selection for children

3. **ParentDashboard** (`/parent-dashboard`)
   - Alert management system
   - Weekly risk trend chart
   - Child selection panel
   - Real-time notifications via WebSocket
   - Alert resolution workflow

4. **ChildDashboard** (`/child-dashboard`)
   - Message safety simulator
   - AI feedback on typed messages
   - Safety tips and best practices
   - Message history tracking

5. **SettingsPage** (`/settings`)
   - Profile management
   - Password change
   - Email alert preferences
   - Dark mode toggle
   - Account logout

6. **LandingPage** (`/`)
   - Marketing landing page
   - Feature overview
   - How it works explanation
   - Call-to-action buttons

### Components

- **PrivateRoute**: Route protection wrapper
- **Navigation**: Sticky top navigation bar
- **AlertCard**: Individual alert display
- **ChildSelector**: Child selection panel
- **Toast**: Notification messages

## State Management

Using Zustand for authentication state:

```javascript
// useAuthStore
- user: Current user object
- token: JWT authentication token
- isAuthenticated: Authentication status
- setUser(), setToken(), logout()
```

## API Integration

All API calls are in `src/services/api.js`:

### Authentication
- `register()` - Register new user
- `login()` - User login
- `changePassword()` - Password update
- `validateToken()` - Token validation

### Messages
- `analyzeMessage()` - Send message for AI analysis
- `getChildMessages()` - Retrieve child messages
- `getUnresolvedMessages()` - Get flagged messages
- `resolveMessage()` - Mark message as handled
- `getHighRiskCount()` - Get high-risk statistics
- `getMediumRiskCount()` - Get medium-risk statistics

### Alerts
- `getParentAlerts()` - Paginated alert list
- `getUnresolvedAlerts()` - Get unresolved alerts
- `getUnresolvedCount()` - Alert count
- `resolveAlert()` - Resolve an alert
- `acknowledgeAlert()` - Acknowledge alert
- `getChildAlerts()` - Get child's alerts

### Users
- `getProfile()` - Get user profile
- `updateProfile()` - Update profile
- `toggleEmailAlerts()` - Toggle email notifications
- `toggleDarkMode()` - Toggle dark mode

### Children
- `addChild()` - Add child to account
- `getParentChildren()` - Get all parent's children
- `getChildDetails()` - Get child profile
- `updateChild()` - Update child info
- `removeChild()` - Remove child

## WebSocket Real-time Updates

Connected in Parent Dashboard:

```javascript
connectWebSocket(userId, token, onMessage)
- Receives NEW_ALERT messages
- Receives STATUS_UPDATE messages
- Auto-reconnects on disconnect
- Maximum 5 reconnection attempts
```

## Styling with Tailwind

### Custom Classes (in index.css)

- `.btn-primary` - Primary button
- `.btn-secondary` - Secondary button
- `.btn-danger` - Danger button
- `.card` - Card component
- `.badge-safe`, `.badge-medium`, `.badge-high` - Risk badges
- `.input-field` - Input styling
- `.heading-1`, `.heading-2`, `.heading-3` - Heading levels
- `.text-muted` - Muted text color

### Dark Mode

Dark mode is automatically applied when user enables it in settings or via system preference.

## Error Handling

- API errors show user-friendly toast messages
- 404 redirects to landing page
- 401 redirects to login
- Form validation before submission

## Performance Optimizations

- Code splitting via Vite
- Lazy loading of pages (React.lazy ready)
- Memoization of components
- WebSocket connection pooling
- Efficient re-renders with Zustand

## Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Fully responsive dashboards
- Touch-friendly interface

## Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- High contrast mode ready
- Screen reader friendly

## Environment Variables

Create `.env.local` file:

```
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_WS_URL=ws://localhost:8080/api/websocket
```

## Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Static Hosting

```bash
npm run build
# Upload dist/ folder to any static host
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (Chrome, Safari)

## Development Tips

1. **Hot Module Replacement**: Changes auto-reload
2. **Redux DevTools**: Use Zustand devtools for debugging
3. **Network Throttling**: Test slow connections
4. **Mobile Testing**: Use Chrome DevTools device mode

## Troubleshooting

### API Connection Errors
- Verify backend is running on port 8080
- Check CORS headers
- Validate API URLs in network tab

### WebSocket Connection Issues
- Check JWT token validity
- Verify WebSocket URL format
- Check browser console for errors

### Styling Issues
- Rebuild Tailwind: `npm run build`
- Clear browser cache
- Check for class name typos

## Contributing

1. Follow existing code style
2. Use meaningful commit messages
3. Test all pages before submitting
4. Ensure dark mode works correctly
5. Test on mobile devices

## Support & Documentation

- Tailwind Docs: https://tailwindcss.com
- React Docs: https://react.dev
- Recharts: https://recharts.org
- Zustand: https://github.com/pmndrs/zustand
