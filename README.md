# 🚀 Jenkins Pipeline Monitor

A comprehensive real-time monitoring dashboard for Jenkins pipelines, designed to help DevOps teams efficiently manage, analyze, and resolve pipeline failures with intelligent automation and notification systems.

## 📋 Table of Contents

- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Installation Guide](#installation-guide)
- [Configuration](#configuration)
- [Usage](#usage)
- [Features](#features)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Jenkins Pipeline Monitor is a powerful Next.js-based application that provides real-time monitoring, intelligent failure analysis, and automated notification management for Jenkins CI/CD pipelines. It addresses the common challenges faced by DevOps teams managing multiple pipelines with complex failure scenarios.

### Key Benefits

- **Reduce故障解决时间**: From hours to minutes with intelligent analysis
- **提高监控效率**: Single interface for all pipeline monitoring
- **智能通知管理**: Priority-based notification routing
- **自动化故障修复**: Pre-built solutions and auto-fix scripts

## 🖥️ System Requirements

### Ubuntu Requirements
- **Minimum Version**: Ubuntu 20.04 LTS (Focal Fossa)
- **Recommended Version**: Ubuntu 22.04 LTS (Jammy Jellyfish) or later
- **Architecture**: x86_64 (64-bit)
- **Memory**: Minimum 4GB RAM, Recommended 8GB RAM
- **Storage**: Minimum 10GB free space, Recommended 20GB+ free space
- **Network**: Stable internet connection for Jenkins API access

### Required Tools & Dependencies

#### Core Development Tools
```bash
# Build tools and essentials
sudo apt update
sudo apt install -y build-essential curl wget git

# Node.js and npm (Node.js 18.x or later required)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x or later
npm --version   # Should show 9.x.x or later
```

#### Database Requirements
```bash
# SQLite3 (included with project, no additional installation needed)
# The project uses SQLite for local data storage
```

#### Optional Development Tools
```bash
# VS Code (recommended IDE)
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -o root -g root -m 644 packages.microsoft.gpg /etc/apt/trusted.gpg.d/
echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/trusted.gpg.d/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list
sudo apt update
sudo apt install -y code

# Git configuration (if not already set)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## 🚀 Installation Guide

### Step 1: System Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y build-essential curl wget git unzip

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version
npm --version
```

### Step 2: Project Setup

```bash
# Clone the repository (if not already cloned)
# git clone <repository-url>
# cd jenkins-pipeline-monitor

# Install project dependencies
npm install

# Install global development dependencies (optional)
sudo npm install -g typescript ts-node nodemon
```

### Step 3: Database Setup

```bash
# Initialize the database
npm run db:push

# This will create the SQLite database with the required schema
# The database file will be located at: db/custom.db
```

### Step 4: Environment Configuration

```bash
# Create environment file
cp .env.example .env.local

# Edit the environment file (optional for development)
nano .env.local
```

Example `.env.local` configuration:
```env
# Next.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Database Configuration (SQLite - no additional config needed)
# DATABASE_URL="file:./db/custom.db"

# Jenkins Configuration (will be set through UI)
# JENKINS_URL=http://your-jenkins-server:8080
# JENKINS_USERNAME=your-username
# JENKINS_API_TOKEN=your-api-token

# Application Configuration
NODE_ENV=development
PORT=3000
```

### Step 5: Development Server Start

```bash
# Start the development server
npm run dev

# Or start with additional logging
npm run dev 2>&1 | tee dev.log
```

The application will be available at: `http://localhost:3000`

### Step 6: Production Deployment (Optional)

```bash
# Build the application
npm run build

# Start production server
npm start

# Or use PM2 for process management
sudo npm install -g pm2
pm2 start ecosystem.config.js
```

## ⚙️ Configuration

### Initial Setup

1. **Access the Application**: Open `http://localhost:3000` in your browser
2. **Configure Jenkins Connection**: 
   - Navigate to the settings/configuration page
   - Enter your Jenkins server URL, username, and API token
   - Test the connection
3. **Enable Monitoring**: 
   - Select the pipelines you want to monitor
   - Configure notification preferences
   - Set up refresh intervals

### Jenkins API Token Setup

To generate a Jenkins API token:

1. Log in to your Jenkins server
2. Go to `Manage Jenkins` → `Manage Users`
3. Select your user
4. Click `Configure`
5. In the API Token section, click `Add new Token`
6. Enter a token name and click `Generate`
7. Copy the generated token and use it in the application

### Demo Mode

The application includes a demo mode that allows you to explore features without connecting to a real Jenkins server:

1. On the initial setup screen, select "Demo Mode"
2. The application will use simulated data to demonstrate all features
3. You can switch to live mode at any time through the settings

## 🎮 Usage

### Dashboard Overview

The main dashboard provides:

- **Pipeline Status Overview**: Real-time status of all monitored pipelines
- **Failure Analytics**: Charts and statistics about failure patterns
- **Recent Failures**: List of recent pipeline failures with analysis
- **System Health**: Jenkins server status and connectivity information

### Monitoring Pipelines

1. **Add Pipelines**: Use the "Add Pipeline" button to monitor new Jenkins jobs
2. **View Details**: Click on any pipeline to see detailed information
3. **Real-time Updates**: The dashboard automatically refreshes pipeline status
4. **Manual Refresh**: Use the refresh button to update data immediately

### Failure Analysis

When a pipeline fails:

1. **Automatic Analysis**: The system automatically analyzes the failure
2. **Failure Classification**: Failures are categorized by type (timeout, memory, network, etc.)
3. **Confidence Score**: Each analysis includes a confidence rating
4. **Recommended Actions**: Suggested solutions based on the failure type

### Notification Management

1. **Priority Settings**: Configure notification priorities for different failure types
2. **Notification Rules**: Set up rules for when and how to receive notifications
3. **Acknowledgment System**: Mark notifications as acknowledged or resolved
4. **Assignment**: Assign failures to team members for resolution

### Log Analysis

1. **Real-time Logs**: View live logs from running pipelines
2. **Log Filtering**: Filter logs by level, text, or regular expressions
3. **Log Search**: Search through historical log data
4. **Log Export**: Export logs for further analysis

## 🌟 Features

### Real-time Monitoring
- Live pipeline status updates
- WebSocket-based real-time communication
- Configurable refresh intervals
- Automatic failure detection

### Intelligent Failure Analysis
- AI-powered failure pattern recognition
- Automatic failure classification
- Confidence scoring for analysis
- Historical trend analysis

### Smart Notifications
- Priority-based notification routing
- Configurable notification rules
- Multi-channel support (in-app, email, Slack)
- Acknowledgment and assignment workflows

### Comprehensive Logging
- Real-time log streaming
- Advanced filtering and search
- Regular expression support
- Log level filtering

### Knowledge Base
- Pre-built solutions for common failures
- Auto-fix scripts with one-click application
- Preventive guidelines and best practices
- Community-contributed solutions

### User Management
- Role-based access control
- User preferences and settings
- Audit logging
- Multi-tenant support

## 📚 API Documentation

### Authentication

All API endpoints require authentication. Use the session cookie or API token:

```bash
# Example API call
curl -X GET "http://localhost:3000/api/jenkins/jobs" \
  -H "Content-Type: application/json" \
  -b "session-cookie"
```

### Key Endpoints

#### Jenkins Integration
- `GET /api/jenkins/jobs` - List all Jenkins jobs
- `GET /api/jenkins/build/:jobName` - Get build information
- `GET /api/jenkins/logs/:jobName/:buildNumber` - Get build logs
- `GET /api/jenkins/system` - Get Jenkins system information

#### Failure Analysis
- `POST /api/failure-analysis` - Analyze pipeline failure
- `GET /api/failure-analysis/stats` - Get failure statistics

#### Notifications
- `GET /api/notifications` - Get notifications
- `POST /api/notifications/actions` - Perform notification actions
- `POST /api/notifications/pipeline-failure` - Handle pipeline failure notifications

#### Knowledge Base
- `GET /api/knowledge-base` - Get knowledge base entries
- `POST /api/knowledge-base` - Add new knowledge base entry

### WebSocket Events

The application uses Socket.IO for real-time updates:

```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000');

// Listen for pipeline updates
socket.on('pipeline-update', (data) => {
  console.log('Pipeline updated:', data);
});

// Listen for failure notifications
socket.on('failure-notification', (data) => {
  console.log('Failure detected:', data);
});
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Node.js Version Issues
```bash
# Check Node.js version
node --version

# If version is less than 18.x, upgrade
sudo apt remove nodejs npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

#### 2. Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
sudo kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

#### 3. Jenkins Connection Issues
```bash
# Test Jenkins connectivity
curl -X GET "http://your-jenkins-server:8080/api/json" \
  -u "username:api-token"

# Check firewall rules
sudo ufw status
sudo ufw allow 3000  # For the application
sudo ufw allow 8080  # For Jenkins (if needed)
```

#### 4. Database Issues
```bash
# Reset database
rm -f db/custom.db
npm run db:push

# Check database permissions
ls -la db/
chmod 644 db/custom.db
```

#### 5. Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev

# Monitor memory usage
free -h
htop
```

### Performance Optimization

```bash
# Enable production mode for better performance
NODE_ENV=production npm run dev

# Use PM2 for production deployment
sudo npm install -g pm2
pm2 start ecosystem.config.js

# Monitor performance
pm2 monit
pm2 logs
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

### Development Guidelines

- Follow the existing code style
- Write TypeScript with strict typing
- Include tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Socket.IO](https://socket.io/) - Real-time communication
- [Jenkins](https://www.jenkins.io/) - Automation server

## 📞 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the troubleshooting section above
- Review the API documentation
- Join our community discussions

---

Built with ❤️ for DevOps teams. Streamline your Jenkins pipeline monitoring today! 🚀