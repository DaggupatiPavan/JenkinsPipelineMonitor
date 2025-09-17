# 🚀 Quick Start Guide

This guide will help you get the Jenkins Pipeline Monitor running quickly.

## Prerequisites

- **Node.js 18.x or later** - Download from [nodejs.org](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Git** - For version control (optional)

## Installation Steps

### 1. Clone or Download the Project

```bash
# If you have the project in a git repository
git clone <repository-url>
cd JenkinsPipelineMonitor

# Or if you have the project files extracted
cd JenkinsPipelineMonitor
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

Create the environment file:

```bash
# Create .env file (if it doesn't exist)
cp .env.example .env
```

Or create it manually:

```bash
cat > .env << EOF
# Database Configuration
DATABASE_URL="file:./db/custom.db"

# Next.js Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=http://localhost:3000

# Application Configuration
NODE_ENV=development
PORT=3000
EOF
```

### 4. Initialize Database

```bash
npm run db:push
```

### 5. Start the Application

```bash
npm run dev
```

### 6. Access the Application

Open your browser and go to: `http://localhost:3000`

## First-Time Configuration

1. **Initial Setup**: The application will guide you through the initial setup
2. **Jenkins Connection**: 
   - Enter your Jenkins server URL
   - Provide your Jenkins username and API token
   - Test the connection
3. **Demo Mode**: You can also try the demo mode to explore features without a real Jenkins server

## Getting Jenkins API Token

1. Log in to your Jenkins server
2. Go to `Manage Jenkins` → `Manage Users`
3. Select your user
4. Click `Configure`
5. In the API Token section, click `Add new Token`
6. Enter a token name and click `Generate`
7. Copy the generated token

## Common Issues

### Database URL Error
If you see `Environment variable not found: DATABASE_URL`:

```bash
# Make sure .env file exists and contains:
echo 'DATABASE_URL="file:./db/custom.db"' > .env
npm run db:push
```

### Port Already in Use
If port 3000 is already in use:

```bash
# Use a different port
PORT=3001 npm run dev
```

### Node.js Version Issues
If you have Node.js version issues:

```bash
# Check version
node --version

# If version < 18, upgrade Node.js
# For Ubuntu:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## What's Next?

- **Explore the Dashboard**: Monitor your Jenkins pipelines in real-time
- **Set Up Notifications**: Configure intelligent failure notifications
- **Use the Knowledge Base**: Access pre-built solutions for common failures
- **View Logs**: Analyze pipeline logs with advanced filtering

## Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review the troubleshooting section
- Check the application logs for error messages

---

Happy monitoring! 🎉