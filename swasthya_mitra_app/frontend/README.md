# Frontend - React Application

This is the React frontend for SwasthyaMitra platform.

## Technologies
- React 18
- React Router 6
- Bootstrap 5
- Axios
- Zustand (State Management)

## Features
- OTP-based authentication
- Patient chat interface
- Appointment management
- Hospital search and booking
- Chief Doctor analytics dashboard
- ASHA worker portal
- Mobile-responsive UI

## Development

### Install dependencies
```bash
npm install
```

### Start development server
```bash
npm start
```

The app will open at http://localhost:3000

### Build for production
```bash
npm run build
```

### Run tests
```bash
npm test
```

## Project Structure

```
src/
├── pages/              # Page components
├── components/         # Reusable components
├── services/           # API calls
├── store/              # Zustand stores
├── styles/             # CSS files
├── App.js              # Main app component
└── index.js            # Entry point
```

## API Configuration

The frontend connects to the backend API at:
- Local: `http://localhost:8000`
- Docker: `http://backend:8000`

Configure via `.env` file:
```
REACT_APP_API_URL=http://localhost:8000
REACT_APP_API_TIMEOUT=30000
```

## Deployment

See main [README.md](../README.md) for Docker deployment instructions.
