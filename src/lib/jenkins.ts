// Jenkins API integration service
export interface JenkinsConfig {
  url: string
  username: string
  apiToken: string
}

export interface JenkinsJob {
  name: string
  url: string
  color: string
  lastBuild?: JenkinsBuild
  builds?: JenkinsBuild[]
}

export interface JenkinsBuild {
  number: number
  url: string
  timestamp: number
  duration: number
  result: 'SUCCESS' | 'FAILURE' | 'ABORTED' | 'UNSTABLE' | 'RUNNING' | 'PENDING'
  building: boolean
  displayName?: string
  fullDisplayName?: string
  description?: string
  actions?: any[]
  stages?: JenkinsStage[]
}

export interface JenkinsStage {
  name: string
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING'
  durationMillis: number
  startTimeMillis: number
  steps?: JenkinsStep[]
}

export interface JenkinsStep {
  name: string
  status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'PENDING'
  durationMillis: number
  log?: string
}

export interface JenkinsView {
  name: string
  url: string
  jobs: JenkinsJob[]
}

class JenkinsService {
  private config: JenkinsConfig | null = null

  constructor(config?: JenkinsConfig) {
    if (config) {
      this.config = config
    }
  }

  setConfig(config: JenkinsConfig) {
    this.config = config
  }

  // Test connection to Jenkins
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.config) {
        return { success: false, message: 'Jenkins configuration not set' }
      }

      // Normalize URL
      let url = this.config.url.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url
      }
      
      // Remove trailing slash
      url = url.replace(/\/+$/, '')
      
      // Update config with normalized URL
      this.config.url = url

      console.log('Testing Jenkins connection to:', url)

      // Test with a simple API call
      const response = await fetch(`${url}/api/json?tree=description`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Jenkins API error:', response.status, errorText)
        
        if (response.status === 401) {
          return { success: false, message: 'Authentication failed. Please check your username and API token.' }
        } else if (response.status === 403) {
          return { success: false, message: 'Access denied. Please check your permissions.' }
        } else if (response.status === 404) {
          return { success: false, message: 'Jenkins API not found. Please check the URL.' }
        } else {
          return { success: false, message: `Jenkins API error: ${response.status} ${response.statusText}` }
        }
      }

      const data = await response.json()
      console.log('Jenkins connection test successful:', data)
      return { success: true, message: 'Connection successful' }
    } catch (error) {
      console.error('Jenkins connection test failed:', error)
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, message: 'Connection timeout. Please check if Jenkins is running and accessible.' }
        } else if (error.message.includes('Failed to fetch')) {
          return { success: false, message: 'Network error. Please check if Jenkins is accessible from this location.' }
        } else if (error.message.includes('ENOTFOUND')) {
          return { success: false, message: 'DNS resolution failed. Please check the Jenkins server URL.' }
        } else {
          return { success: false, message: `Connection failed: ${error.message}` }
        }
      }
      return { success: false, message: 'Unknown connection error' }
    }
  }

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.config) {
      throw new Error('Jenkins configuration not set')
    }

    const auth = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')
    
    // Ensure URL ends with / and doesn't have double slashes
    const baseUrl = this.config.url.replace(/\/+$/, '')
    const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`

    console.log('Making Jenkins request to:', url)

    try {
      // Try with CORS headers first
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'User-Agent': 'JenkinsPipelineMonitor/1.0',
          'X-Requested-With': 'XMLHttpRequest',
        },
        // Add timeout
        signal: AbortSignal.timeout(30000), // 30 second timeout
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Jenkins API error response:', errorText)
        
        // Try alternative approach for CORS issues
        if (response.status === 403 && errorText.includes('CSRF')) {
          console.log('Attempting to handle CSRF/CORS issues...')
          return await this.makeRequestWithCrumb(endpoint)
        }
        
        throw new Error(`Jenkins API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Jenkins API request failed:', error)
      if (error instanceof Error) {
        throw new Error(`Jenkins connection failed: ${error.message}`)
      }
      throw error
    }
  }

  // Alternative request method for CSRF/CORS issues
  private async makeRequestWithCrumb(endpoint: string): Promise<any> {
    if (!this.config) {
      throw new Error('Jenkins configuration not set')
    }

    const auth = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')
    const baseUrl = this.config.url.replace(/\/+$/, '')
    const url = `${baseUrl}/crumbIssuer/api/json`

    try {
      // Get CSRF crumb
      console.log('Getting CSRF crumb...')
      const crumbResponse = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })

      if (crumbResponse.ok) {
        const crumbData = await crumbResponse.json()
        const requestUrl = `${baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`
        
        // Make request with crumb
        const response = await fetch(requestUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'JenkinsPipelineMonitor/1.0',
            [crumbData.crumbRequestField]: crumbData.crumb,
          },
          signal: AbortSignal.timeout(30000),
        })

        if (response.ok) {
          return await response.json()
        } else {
          const errorText = await response.text()
          throw new Error(`Failed even with crumb: ${response.status} ${response.statusText} - ${errorText}`)
        }
      } else {
        throw new Error('Failed to get CSRF crumb')
      }
    } catch (error) {
      console.error('Crumb request failed:', error)
      throw new Error(`CSRF crumb request failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getJobs(): Promise<JenkinsJob[]> {
    try {
      const data = await this.makeRequest('/api/json?tree=jobs[name,url,color,lastBuild[number,url,timestamp,duration,result,building]]')
      return data.jobs || []
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
      return []
    }
  }

  async getJobDetails(jobName: string): Promise<JenkinsJob> {
    const encodedJobName = encodeURIComponent(jobName)
    const data = await this.makeRequest(`/job/${encodedJobName}/api/json?tree=name,url,color,lastBuild[number,url,timestamp,duration,result,building,actions[parameters[name,value]],builds[number,url,timestamp,duration,result,building]]`)
    return data
  }

  async getBuildDetails(jobName: string, buildNumber: number): Promise<JenkinsBuild> {
    const encodedJobName = encodeURIComponent(jobName)
    const data = await this.makeRequest(`/job/${encodedJobName}/${buildNumber}/api/json?tree=number,url,timestamp,duration,result,building,displayName,fullDisplayName,description,actions[parameters[name,value]],stages[name,status,durationMillis,startTimeMillis,steps[name,status,durationMillis,log]]`)
    return data
  }

  async getBuildLog(jobName: string, buildNumber: number): Promise<string> {
    const encodedJobName = encodeURIComponent(jobName)
    const response = await fetch(`${this.config!.url}/job/${encodedJobName}/${buildNumber}/consoleText`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${this.config!.username}:${this.config!.apiToken}`).toString('base64')}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch build log: ${response.status} ${response.statusText}`)
    }

    return await response.text()
  }

  async getViews(): Promise<JenkinsView[]> {
    const data = await this.makeRequest('/api/json?tree=views[name,url,jobs[name,url,color]]')
    return data.views || []
  }

  async triggerBuild(jobName: string, parameters?: Record<string, any>): Promise<void> {
    const encodedJobName = encodeURIComponent(jobName)
    const params = new URLSearchParams()
    
    if (parameters) {
      Object.entries(parameters).forEach(([key, value]) => {
        params.append(key, String(value))
      })
    }

    await this.makeRequest(`/job/${encodedJobName}/buildWithParameters?${params.toString()}`)
  }

  async stopBuild(jobName: string, buildNumber: number): Promise<void> {
    const encodedJobName = encodeURIComponent(jobName)
    await this.makeRequest(`/job/${encodedJobName}/${buildNumber}/stop`)
  }

  async getQueue(): Promise<any[]> {
    const data = await this.makeRequest('/queue/api/json?tree=items[id,task[name,url],actions[parameters[name,value]],inQueueSince,why]')
    return data.items || []
  }

  async getComputerInfo(): Promise<any> {
    const data = await this.makeRequest('/computer/api/json?tree=computer[displayName,idle,offline,numExecutors,executors[currentExecutable[url]]]')
    return data
  }

  // Helper method to convert Jenkins build status to our app status
  static convertBuildStatus(result: string, building: boolean): 'running' | 'success' | 'failed' | 'pending' {
    if (building) return 'running'
    if (result === 'SUCCESS') return 'success'
    if (result === 'FAILURE') return 'failed'
    return 'pending'
  }

  // Helper method to get failure reason from build actions
  static getFailureReason(build: JenkinsBuild): string | null {
    if (!build.actions) return null
    
    // Look for failure cause in actions
    for (const action of build.actions) {
      if (action._class === 'hudson.model.CauseAction') {
        const causes = action.causes || []
        if (causes.length > 0) {
          return causes[0].shortDescription || 'Unknown cause'
        }
      }
    }
    
    return null
  }

  // Helper method to get build parameters
  static getBuildParameters(build: JenkinsBuild): Record<string, any> {
    if (!build.actions) return {}
    
    for (const action of build.actions) {
      if (action._class === 'hudson.model.ParametersAction') {
        const params: Record<string, any> = {}
        action.parameters?.forEach((param: any) => {
          params[param.name] = param.value
        })
        return params
      }
    }
    
    return {}
  }
}

// Singleton instance
export const jenkinsService = new JenkinsService()

// Export for testing
export { JenkinsService }