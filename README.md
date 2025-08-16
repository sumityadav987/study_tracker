# AI-Powered Study Tracker

A privacy-first, AI-powered study tracker that uses computer vision to monitor engagement and provide real-time feedback. Built with the MERN stack and on-device AI processing.

## 🚀 Features

- **Privacy-First**: All AI processing happens in your browser. No raw images or video ever leave your device.
- **Real-time Engagement Tracking**: Face detection, eye tracking, and hand gesture recognition
- **Gentle Nudges**: Smart notifications to keep you focused without being intrusive
- **Local-First Storage**: All data stored locally by default with optional cloud sync
- **Comprehensive Analytics**: Detailed insights into your study sessions with beautiful charts
- **Progressive Web App**: Works offline and can be installed on your device

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js + MongoDB + Mongoose
- **Authentication**: Firebase Auth (Email/Password + Google)
- **AI/CV**: face-api.js + MediaPipe + TensorFlow.js (WebGL backend)
- **Storage**: IndexedDB (local) + MongoDB (optional cloud sync)
- **State Management**: Zustand
- **Charts**: Chart.js 4
- **UI Components**: Headless UI
- **Testing**: Jest + React Testing Library + Cypress

## 📋 Prerequisites

- Node.js 20+
- npm 10+ or pnpm 8+
- MongoDB Atlas account (for cloud sync)
- Firebase project with Authentication enabled

## 🔧 Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ai-study-tracker
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com
2. Enable Authentication and add these sign-in methods:
   - Email/Password
   - Google
3. Add a web app to your project
4. Copy the configuration and update `apps/web/.env`

### 3. MongoDB Setup (Optional - for Cloud Sync)

1. Create a MongoDB Atlas cluster at https://cloud.mongodb.com
2. Get your connection string
3. Update `apps/api/.env`

### 4. Environment Configuration

Copy the example files and fill in your credentials:

```bash
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

### 5. Development

Start both frontend and backend:

```bash
npm run dev
```

This will start:
- Web app at http://localhost:5173
- API server at http://localhost:4000

## 📱 Usage

1. **Login**: Sign in with email/password or Google
2. **Setup**: Grant camera permissions and calibrate your baseline
3. **Study**: Start a session and let the AI track your engagement
4. **Review**: View detailed analytics and get personalized tips

## 🔒 Privacy & Security

- **No Raw Data Storage**: We never store or transmit video frames or images
- **On-Device Processing**: All AI runs in your browser using WebGL/WASM
- **Local-First**: Data stored locally by default using IndexedDB
- **Optional Cloud Sync**: You control whether to sync aggregated metrics to the cloud
- **Secure Authentication**: Firebase handles all authentication with industry standards

## 🏗️ Project Structure

```
ai-study-tracker/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Express API
├── package.json      # Workspace root
└── README.md
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:web

# Run API tests
npm run test:api

# Run E2E tests
npm run test:e2e
```

## 🚀 Production Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build:web
# Deploy the apps/web/dist folder
```

### Backend (Railway/Render)
```bash
npm run build:api
# Deploy with start command: npm run start:api
```

## 📊 Demo Scenario

1. Open http://localhost:5173
2. Sign up with a test email
3. Complete the setup (allow camera access)
4. Start a 2-minute study session
5. Look away or close eyes to trigger notifications
6. View the summary with engagement analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Troubleshooting

### Camera Issues
- Ensure you're using HTTPS (required for camera access)
- Check browser permissions for camera access
- Try refreshing the page if models fail to load

### Performance Issues
- Enable "Low Power Mode" in settings
- Close other camera-using applications
- Try a different browser (Chrome recommended)

### Browser Compatibility
- ✅ Chrome/Edge 90+ (full support)
- ✅ Firefox 88+ (full support)
- ⚠️ Safari 14+ (limited MediaPipe support)

## 📞 Support

For issues and questions, please open a GitHub issue or contact the development team.