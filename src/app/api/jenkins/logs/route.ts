import { NextRequest, NextResponse } from 'next/server'
import { jenkinsService } from '@/lib/jenkins'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobName = searchParams.get('jobName')
    const buildNumber = searchParams.get('buildNumber')
    const jenkinsUrl = searchParams.get('url')
    const username = searchParams.get('username')
    const apiToken = searchParams.get('apiToken')

    if (!jobName || !buildNumber || !jenkinsUrl || !username || !apiToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Set configuration for this request
    jenkinsService.setConfig({
      url: jenkinsUrl,
      username,
      apiToken
    })

    const logs = await jenkinsService.getBuildLog(jobName, parseInt(buildNumber))
    
    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching Jenkins build logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch build logs' },
      { status: 500 }
    )
  }
}