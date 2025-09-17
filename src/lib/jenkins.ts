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

  private async makeRequest(endpoint: string): Promise<any> {
    if (!this.config) {
      throw new Error('Jenkins configuration not set')
    }

    const auth = Buffer.from(`${this.config.username}:${this.config.apiToken}`).toString('base64')
    const url = `${this.config.url}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Jenkins API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Jenkins API request failed:', error)
      throw error
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