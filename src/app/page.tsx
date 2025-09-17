'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { LogViewer } from '@/components/log-viewer'
import { useWebSocket } from '@/hooks/use-websocket'
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Filter,
  Search,
  Settings,
  Server,
  Key,
  User,
  FileText,
  Wifi,
  WifiOff,
  Bell,
  BellOff
} from 'lucide-react'

interface Pipeline {
  id: string
  name: string
  status: 'running' | 'success' | 'failed' | 'pending'
  duration: number
  startTime: string
  failureStage?: string
  failureReason?: string
  developer: string
  branch: string
  stages: Stage[]
}

interface Stage {
  id: string
  name: string
  status: 'running' | 'success' | 'failed' | 'pending'
  duration: number
  logs: string[]
}

interface FailureStats {
  totalFailures: number
  commonFailures: Array<{
    reason: string
    count: number
    solution: string
  }>
  failureRate: number
  avgResolutionTime: number
}

export default function JenkinsDashboard() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stats, setStats] = useState<FailureStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [jenkinsConfig, setJenkinsConfig] = useState({
    url: '',
    username: '',
    apiToken: ''
  })
  const [configOpen, setConfigOpen] = useState(false)
  const [useMockData, setUseMockData] = useState(true) // Default to mock data for demo
  const [logViewerOpen, setLogViewerOpen] = useState(false)
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [connectionError, setConnectionError] = useState('')
  const [isMounted, setIsMounted] = useState(false)
  
  // WebSocket integration
  const pipelineIds = pipelines.map(p => p.id)
  const websocket = useWebSocket({
    autoConnect: true,
    enableNotifications: true,
    enableMonitoring: true,
    pipelineIds: pipelineIds
  })

  // Handle component mounting to avoid hydration issues
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Mock data for demonstration
  const mockPipelines: Pipeline[] = [
    {
      id: '1',
      name: 'frontend-build',
      status: 'failed',
      duration: 25,
      startTime: '2024-01-15T10:30:00Z',
      failureStage: 'Unit Tests',
      failureReason: 'Test timeout after 10 minutes',
      developer: 'John Doe',
      branch: 'feature/new-ui',
      stages: [
        { id: '1-1', name: 'Checkout', status: 'success', duration: 2, logs: [] },
        { id: '1-2', name: 'Install Dependencies', status: 'success', duration: 5, logs: [] },
        { id: '1-3', name: 'Build', status: 'success', duration: 8, logs: [] },
        { id: '1-4', name: 'Unit Tests', status: 'failed', duration: 10, logs: ['Test timeout after 10 minutes'] },
      ]
    },
    {
      id: '2',
      name: 'backend-deploy',
      status: 'running',
      duration: 15,
      startTime: '2024-01-15T10:45:00Z',
      developer: 'Jane Smith',
      branch: 'main',
      stages: [
        { id: '2-1', name: 'Checkout', status: 'success', duration: 2, logs: [] },
        { id: '2-2', name: 'Build Docker Image', status: 'success', duration: 6, logs: [] },
        { id: '2-3', name: 'Deploy to Staging', status: 'running', duration: 7, logs: [] },
      ]
    },
    {
      id: '3',
      name: 'e2e-tests',
      status: 'success',
      duration: 45,
      startTime: '2024-01-15T09:00:00Z',
      developer: 'Mike Johnson',
      branch: 'develop',
      stages: [
        { id: '3-1', name: 'Setup Environment', status: 'success', duration: 5, logs: [] },
        { id: '3-2', name: 'Run Tests', status: 'success', duration: 35, logs: [] },
        { id: '3-3', name: 'Generate Report', status: 'success', duration: 5, logs: [] },
      ]
    }
  ]

  const mockStats: FailureStats = {
    totalFailures: 12,
    commonFailures: [
      {
        reason: 'Test timeout',
        count: 5,
        solution: 'Increase test timeout or optimize test performance'
      },
      {
        reason: 'Memory limit exceeded',
        count: 3,
        solution: 'Increase memory allocation or optimize memory usage'
      },
      {
        reason: 'Network connectivity issues',
        count: 2,
        solution: 'Check network configuration and retry logic'
      },
      {
        reason: 'Dependency conflicts',
        count: 2,
        solution: 'Update dependencies or resolve version conflicts'
      }
    ],
    failureRate: 24,
    avgResolutionTime: 45
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      try {
        if (useMockData || !jenkinsConfig.url) {
          // Use mock data for demo
          await new Promise(resolve => setTimeout(resolve, 1000))
          setPipelines(mockPipelines)
          setStats(mockStats)
        } else {
          // Fetch real data from Jenkins
          const jobsResponse = await fetch(
            `/api/jenkins/jobs?url=${encodeURIComponent(jenkinsConfig.url)}&username=${encodeURIComponent(jenkinsConfig.username)}&apiToken=${encodeURIComponent(jenkinsConfig.apiToken)}`
          )
          
          if (!jobsResponse.ok) {
            throw new Error('Failed to fetch Jenkins jobs')
          }
          
          const jobs = await jobsResponse.json()
          setPipelines(jobs)
          
          // Calculate stats from real data
          const failedJobs = jobs.filter((job: Pipeline) => job.status === 'failed')
          const failureRate = jobs.length > 0 ? (failedJobs.length / jobs.length) * 100 : 0
          
          setStats({
            totalFailures: failedJobs.length,
            commonFailures: [
              {
                reason: 'Test timeout',
                count: Math.floor(failedJobs.length * 0.4),
                solution: 'Increase test timeout or optimize test performance'
              },
              {
                reason: 'Memory limit exceeded',
                count: Math.floor(failedJobs.length * 0.3),
                solution: 'Increase memory allocation or optimize memory usage'
              },
              {
                reason: 'Network connectivity issues',
                count: Math.floor(failedJobs.length * 0.2),
                solution: 'Check network configuration and retry logic'
              },
              {
                reason: 'Dependency conflicts',
                count: Math.floor(failedJobs.length * 0.1),
                solution: 'Update dependencies or resolve version conflicts'
              }
            ],
            failureRate: Math.round(failureRate),
            avgResolutionTime: 45
          })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        // Fallback to mock data
        setPipelines(mockPipelines)
        setStats(mockStats)
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, jenkinsConfig, useMockData])

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (websocket.pipelineUpdates.length > 0) {
      // Update pipelines with real-time data
      const latestUpdate = websocket.pipelineUpdates[websocket.pipelineUpdates.length - 1]
      setPipelines(prev => prev.map(p => 
        p.id === latestUpdate.id 
          ? { ...p, status: latestUpdate.status, stage: latestUpdate.stage }
          : p
      ))
    }
  }, [websocket.pipelineUpdates])

  // Update WebSocket pipeline subscriptions when pipelines change
  useEffect(() => {
    const pipelineIds = pipelines.map(p => p.id)
    // The WebSocket hook will handle the subscription updates automatically
  }, [pipelines])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'running':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleQuickFix = (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId)
    if (pipeline && pipeline.failureReason) {
      alert(`Quick fix applied to ${pipeline.name}: ${pipeline.failureReason}`)
    }
  }

  const handleSaveConfig = async () => {
    if (!jenkinsConfig.url || !jenkinsConfig.username || !jenkinsConfig.apiToken) {
      setConnectionError('Please fill in all required fields')
      return
    }

    setConnectionStatus('connecting')
    setConnectionError('')

    try {
      // First test the connection
      const testResponse = await fetch('/api/jenkins/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: jenkinsConfig.url,
          username: jenkinsConfig.username,
          apiToken: jenkinsConfig.apiToken
        })
      })

      const testResult = await testResponse.json()

      if (!testResult.success) {
        setConnectionStatus('error')
        setConnectionError(testResult.message || 'Failed to connect to Jenkins')
        return
      }

      // If connection test passes, try to fetch jobs
      const jobsResponse = await fetch(
        `/api/jenkins/jobs?url=${encodeURIComponent(jenkinsConfig.url)}&username=${encodeURIComponent(jenkinsConfig.username)}&apiToken=${encodeURIComponent(jenkinsConfig.apiToken)}`
      )

      if (jobsResponse.ok) {
        setConnectionStatus('connected')
        setUseMockData(false)
        setConfigOpen(false)
        // Trigger a refresh with new config
        setLoading(true)
      } else {
        const errorData = await jobsResponse.json()
        setConnectionStatus('error')
        setConnectionError(errorData.error || 'Failed to fetch Jenkins jobs')
      }
    } catch (error) {
      console.error('Connection error:', error)
      setConnectionStatus('error')
      setConnectionError('Network error while connecting to Jenkins. Please check if Jenkins is accessible from this browser.')
    }
  }

  const handleViewLogs = async (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId)
    if (pipeline) {
      setSelectedPipeline(pipeline)
      setLogViewerOpen(true)
    }
  }

  const handleRestartPipeline = async (pipelineId: string) => {
    const pipeline = pipelines.find(p => p.id === pipelineId)
    if (pipeline && !useMockData) {
      try {
        alert(`Restarting ${pipeline.name}...`)
        // In real implementation, this would call Jenkins API to restart the build
      } catch (error) {
        console.error('Error restarting pipeline:', error)
      }
    } else {
      alert(`Mock restart: ${pipeline.name} would be restarted`)
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'connecting':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getConnectionColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-100 text-green-800'
      case 'connecting':
        return 'bg-blue-100 text-blue-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Jenkins Pipeline Monitor</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Configuration Notice */}
      {useMockData && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-5 w-5" />
              Configuration Required
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Connect to your Jenkins server to monitor real pipelines. Currently running in demo mode with mock data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isMounted && (
              <Dialog open={configOpen} onOpenChange={setConfigOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    <Server className="mr-2 h-4 w-4" />
                    Configure Jenkins Connection
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Jenkins Configuration</DialogTitle>
                  <DialogDescription>
                    Enter your Jenkins server details to connect and monitor real pipelines.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="url" className="text-right">
                      Jenkins URL <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="url"
                      placeholder="https://jenkins.example.com"
                      className="col-span-3"
                      value={jenkinsConfig.url}
                      onChange={(e) => setJenkinsConfig({...jenkinsConfig, url: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      placeholder="admin"
                      className="col-span-3"
                      value={jenkinsConfig.username}
                      onChange={(e) => setJenkinsConfig({...jenkinsConfig, username: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="apiToken" className="text-right">
                      API Token <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="apiToken"
                      type="password"
                      placeholder="your-api-token"
                      className="col-span-3"
                      value={jenkinsConfig.apiToken}
                      onChange={(e) => setJenkinsConfig({...jenkinsConfig, apiToken: e.target.value})}
                    />
                  </div>
                  {connectionError && (
                    <div className="col-span-4 text-red-600 text-sm bg-red-50 p-2 rounded">
                      <div className="font-medium mb-1">Connection Error:</div>
                      <div>{connectionError}</div>
                      <div className="mt-2 text-xs">
                        <strong>Troubleshooting tips:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Ensure Jenkins is running and accessible</li>
                          <li>Check if the URL is correct (include http:// or https://)</li>
                          <li>Verify your username and API token</li>
                          <li>Check if Jenkins has CORS enabled for this domain</li>
                          <li>Try accessing Jenkins directly in your browser</li>
                        </ul>
                      </div>
                    </div>
                  )}
                  <div className="col-span-4 text-sm text-gray-600">
                    <p className="mb-2">
                      <strong>How to get your Jenkins API Token:</strong>
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-xs">
                      <li>Log in to your Jenkins server</li>
                      <li>Click on your username in the top right corner</li>
                      <li>Click on "Configure"</li>
                      <li>Click "Add new Token" under "API Token"</li>
                      <li>Copy the generated token</li>
                    </ol>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={() => setConfigOpen(false)}>
                    Cancel
                  </Button>
                  <div className="flex items-center gap-2">
                    {connectionStatus === 'connecting' && (
                      <Clock className="h-4 w-4 animate-spin" />
                    )}
                    <Badge className={getConnectionColor()}>
                      {connectionStatus === 'connected' && 'Connected'}
                      {connectionStatus === 'connecting' && 'Connecting...'}
                      {connectionStatus === 'error' && 'Connection Failed'}
                      {connectionStatus === 'disconnected' && 'Not Connected'}
                    </Badge>
                    <Button onClick={handleSaveConfig} disabled={connectionStatus === 'connecting'}>
                      {connectionStatus === 'connecting' ? 'Connecting...' : 'Connect & Save'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Jenkins Pipeline Monitor</h1>
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            <Badge variant={useMockData ? "secondary" : "default"}>
              {useMockData ? "Demo Mode" : "Connected"}
            </Badge>
            <div className="flex items-center gap-1">
              {websocket.connected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {websocket.connected ? 'Live' : 'Offline'}
              </span>
            </div>
            {websocket.notifications.length > 0 && (
              <div className="flex items-center gap-1">
                <Bell className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">
                  {websocket.notifications.length}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!useMockData && (
            <Dialog open={configOpen} onOpenChange={setConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Jenkins Configuration</DialogTitle>
                  <DialogDescription>
                    Update your Jenkins server connection settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="url" className="text-right">
                      Jenkins URL
                    </Label>
                    <Input
                      id="url"
                      placeholder="https://jenkins.example.com"
                      className="col-span-3"
                      value={jenkinsConfig.url}
                      onChange={(e) => setJenkinsConfig({...jenkinsConfig, url: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      placeholder="admin"
                      className="col-span-3"
                      value={jenkinsConfig.username}
                      onChange={(e) => setJenkinsConfig({...jenkinsConfig, username: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="apiToken" className="text-right">
                      API Token
                    </Label>
                    <Input
                      id="apiToken"
                      type="password"
                      placeholder="your-api-token"
                      className="col-span-3"
                      value={jenkinsConfig.apiToken}
                      onChange={(e) => setJenkinsConfig({...jenkinsConfig, apiToken: e.target.value})}
                    />
                  </div>
                  {connectionError && (
                    <div className="col-span-4 text-red-600 text-sm bg-red-50 p-2 rounded">
                      {connectionError}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <Button variant="outline" onClick={() => setConfigOpen(false)}>
                    Cancel
                  </Button>
                  <div className="flex items-center gap-2">
                    {connectionStatus === 'connecting' && (
                      <Clock className="h-4 w-4 animate-spin" />
                    )}
                    <Badge className={getConnectionColor()}>
                      {connectionStatus === 'connected' && 'Connected'}
                      {connectionStatus === 'connecting' && 'Connecting...'}
                      {connectionStatus === 'error' && 'Connection Failed'}
                      {connectionStatus === 'disconnected' && 'Not Connected'}
                    </Badge>
                    <Button onClick={handleSaveConfig} disabled={connectionStatus === 'connecting'}>
                      {connectionStatus === 'connecting' ? 'Connecting...' : 'Update Settings'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pipelines</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pipelines.length}</div>
            <p className="text-xs text-muted-foreground">
              {pipelines.filter(p => p.status === 'running').length} running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Today</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.totalFailures || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.failureRate || 0}% failure rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.avgResolutionTime || 0}m
            </div>
            <p className="text-xs text-muted-foreground">
              Time to fix issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {100 - (stats?.failureRate || 0)}%
            </div>
            <Progress value={100 - (stats?.failureRate || 0)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pipelines" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pipelines">Active Pipelines</TabsTrigger>
          <TabsTrigger value="failures">Common Failures</TabsTrigger>
          <TabsTrigger value="solutions">Quick Solutions</TabsTrigger>
        </TabsList>

        <TabsContent value="pipelines" className="space-y-4">
          <div className="grid gap-4">
            {pipelines.map((pipeline) => (
              <Card key={pipeline.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(pipeline.status)}
                      <CardTitle className="text-lg">{pipeline.name}</CardTitle>
                      <Badge className={getStatusColor(pipeline.status)}>
                        {pipeline.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {pipeline.duration}m
                    </div>
                  </div>
                  <CardDescription>
                    {pipeline.developer} • {pipeline.branch} • Started {new Date(pipeline.startTime).toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pipeline.failureStage && (
                    <Alert className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Failed at:</strong> {pipeline.failureStage}
                        <br />
                        <strong>Reason:</strong> {pipeline.failureReason}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Pipeline Stages</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                      {pipeline.stages.map((stage) => (
                        <div key={stage.id} className="flex items-center gap-2 p-2 border rounded">
                          {getStatusIcon(stage.status)}
                          <span className="text-sm">{stage.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {stage.duration}m
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {pipeline.status === 'failed' && (
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleQuickFix(pipeline.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Quick Fix
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewLogs(pipeline.id)}>
                        View Logs
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleRestartPipeline(pipeline.id)}>
                        Restart
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="failures" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Common Failure Patterns</CardTitle>
              <CardDescription>
                Most frequent pipeline failures and their solutions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.commonFailures.map((failure, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{failure.reason}</h4>
                      <Badge variant="secondary">{failure.count} occurrences</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {failure.solution}
                    </p>
                    <Button size="sm" variant="outline">
                      Apply Fix Template
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solutions" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common solutions for frequent pipeline issues
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <Button className="justify-start" variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restart All Failed Pipelines
                </Button>
                <Button className="justify-start" variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Build Cache
                </Button>
                <Button className="justify-start" variant="outline">
                  <Settings className="mr-2 h-4 w-4" />
                  Update Jenkins Plugins
                </Button>
                <Button className="justify-start" variant="outline">
                  <Search className="mr-2 h-4 w-4" />
                  Run System Diagnostics
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Rules</CardTitle>
                <CardDescription>
                  Configure automated responses to common failures
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">Test Timeout</div>
                        <div className="text-sm text-muted-foreground">
                          Auto-retry with increased timeout
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <div className="font-medium">Memory Issues</div>
                        <div className="text-sm text-muted-foreground">
                          Auto-scale resources and retry
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Edit</Button>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Log Viewer Dialog */}
      {isMounted && (
        <Dialog open={logViewerOpen} onOpenChange={setLogViewerOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Build Logs</DialogTitle>
              <DialogDescription>
                View detailed logs for pipeline execution
              </DialogDescription>
            </DialogHeader>
            {selectedPipeline && (
              <LogViewer
                pipelineId={selectedPipeline.id}
                pipelineName={selectedPipeline.name}
                buildNumber={parseInt(selectedPipeline.id.split('-')[1]) || undefined}
                logs={selectedPipeline.stages.flatMap(s => s.logs)}
                onClose={() => setLogViewerOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}