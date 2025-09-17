'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function DebugPage() {
  const [config, setConfig] = useState({
    url: 'http://20.121.40.237:8080',
    username: 'admin',
    apiToken: ''
  })
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runTest = async (testName: string, endpoint: string, description: string) => {
    try {
      const auth = Buffer.from(`${config.username}:${config.apiToken}`).toString('base64')
      const response = await fetch(`${config.url}${endpoint}`, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'JenkinsPipelineMonitor/1.0',
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: AbortSignal.timeout(10000),
      })

      const result = {
        testName,
        description,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      }

      try {
        const data = await response.json()
        result.data = data
      } catch (e) {
        const text = await response.text()
        result.text = text
      }

      setResults(prev => [...prev, result])
      return result
    } catch (error) {
      const result = {
        testName,
        description,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }
      setResults(prev => [...prev, result])
      return result
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setResults([])

    try {
      // Test 1: Basic Jenkins info
      await runTest('Basic API', '/api/json?tree=description', 'Basic Jenkins API access')

      // Test 2: Jobs list
      await runTest('Jobs List', '/api/json?tree=jobs[name,url,color,lastBuild[number,url,timestamp,duration,result,building]]', 'Get all jobs')

      // Test 3: Specific job
      await runTest('Job Details', '/job/test/api/json?tree=name,url,color,lastBuild[number,url,timestamp,duration,result,building]', 'Get specific job details')

      // Test 4: Without auth
      try {
        const response = await fetch(`${config.url}/api/json?tree=description`, {
          signal: AbortSignal.timeout(10000),
        })
        setResults(prev => [...prev, {
          testName: 'No Auth Test',
          description: 'Test without authentication',
          status: response.status,
          statusText: response.statusText,
          success: response.status === 403, // 403 is expected (good security)
          timestamp: new Date().toISOString()
        }])
      } catch (error) {
        setResults(prev => [...prev, {
          testName: 'No Auth Test',
          description: 'Test without authentication',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }])
      }

      // Test 5: CORS headers
      try {
        const response = await fetch(`${config.url}/api/json?tree=description`, {
          headers: {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Authorization',
          },
          method: 'OPTIONS',
          signal: AbortSignal.timeout(10000),
        })
        setResults(prev => [...prev, {
          testName: 'CORS Preflight',
          description: 'Test CORS preflight request',
          status: response.status,
          statusText: response.statusText,
          success: response.status === 200 || response.status === 204,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: new Date().toISOString()
        }])
      } catch (error) {
        setResults(prev => [...prev, {
          testName: 'CORS Preflight',
          description: 'Test CORS preflight request',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }])
      }

    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (result: any) => {
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (result.status === 403) return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusBadge = (result: any) => {
    if (result.success) return <Badge className="bg-green-100 text-green-800">Success</Badge>
    if (result.status === 403) return <Badge className="bg-yellow-100 text-yellow-800">Expected (403)</Badge>
    return <Badge className="bg-red-100 text-red-800">Failed</Badge>
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Jenkins Connection Debug</h1>
          <p className="text-muted-foreground">
            Test your Jenkins server connection and diagnose issues
          </p>
        </div>
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Jenkins Configuration</CardTitle>
          <CardDescription>
            Enter your Jenkins server details for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="url">Jenkins URL</Label>
              <Input
                id="url"
                value={config.url}
                onChange={(e) => setConfig({...config, url: e.target.value})}
                placeholder="http://jenkins.example.com:8080"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={config.username}
                onChange={(e) => setConfig({...config, username: e.target.value})}
                placeholder="admin"
              />
            </div>
            <div>
              <Label htmlFor="apiToken">API Token</Label>
              <Input
                id="apiToken"
                type="password"
                value={config.apiToken}
                onChange={(e) => setConfig({...config, apiToken: e.target.value})}
                placeholder="your-api-token"
              />
            </div>
          </div>
          <Button onClick={runAllTests} disabled={loading || !config.apiToken}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run All Tests
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Results from Jenkins connection tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(result)}
                      <h3 className="font-medium">{result.testName}</h3>
                      {getStatusBadge(result)}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.description}
                  </p>
                  
                  {result.status && (
                    <div className="text-sm mb-2">
                      <span className="font-medium">Status: </span>
                      <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                        {result.status} {result.statusText}
                      </span>
                    </div>
                  )}
                  
                  {result.error && (
                    <Alert className="mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{result.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer hover:underline">
                        View Response Data
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  
                  {result.headers && Object.keys(result.headers).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer hover:underline">
                        View Response Headers
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                        {JSON.stringify(result.headers, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Troubleshooting Tips</CardTitle>
          <CardDescription>
            Common issues and solutions for Jenkins connection problems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">1. CORS Issues</h4>
              <p className="text-sm text-muted-foreground">
                If you see CORS errors, ensure the CORS plugin is properly configured in Jenkins with the correct headers.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Authentication Issues</h4>
              <p className="text-sm text-muted-foreground">
                If you see 401/403 errors, verify your API token is correct and your user has proper permissions.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. CSRF Protection</h4>
              <p className="text-sm text-muted-foreground">
                If you see CSRF errors, you may need to temporarily disable CSRF protection or configure it properly.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">4. Network Issues</h4>
              <p className="text-sm text-muted-foreground">
                If you see timeout errors, check if Jenkins is accessible from your network and no firewalls are blocking requests.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}