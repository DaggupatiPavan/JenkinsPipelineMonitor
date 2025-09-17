import { NextRequest, NextResponse } from 'next/server'
import { jenkinsService } from '@/lib/jenkins'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jenkinsUrl = searchParams.get('url')
    const username = searchParams.get('username')
    const apiToken = searchParams.get('apiToken')

    if (!jenkinsUrl || !username || !apiToken) {
      return NextResponse.json(
        { error: 'Missing Jenkins configuration parameters' },
        { status: 400 }
      )
    }

    // Set configuration for this request
    jenkinsService.setConfig({
      url: jenkinsUrl,
      username,
      apiToken
    })

    const jobs = await jenkinsService.getJobs()
    
    // Transform jobs to match our frontend interface
    const transformedJobs = jobs.map(job => ({
      id: job.name,
      name: job.name,
      status: jenkinsService.convertBuildStatus(
        job.lastBuild?.result || 'PENDING',
        job.lastBuild?.building || false
      ),
      duration: job.lastBuild ? Math.floor(job.lastBuild.duration / 60000) : 0,
      startTime: job.lastBuild ? new Date(job.lastBuild.timestamp).toISOString() : new Date().toISOString(),
      failureStage: job.lastBuild?.result === 'FAILURE' ? 'Unknown' : undefined,
      failureReason: job.lastBuild ? jenkinsService.getFailureReason(job.lastBuild) : undefined,
      developer: jenkinsService.getBuildParameters(job.lastBuild || {} as any).developer || 'Unknown',
      branch: jenkinsService.getBuildParameters(job.lastBuild || {} as any).branch || 'main',
      stages: [] // Will be populated when getting build details
    }))

    return NextResponse.json(transformedJobs)
  } catch (error) {
    console.error('Error fetching Jenkins jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Jenkins jobs' },
      { status: 500 }
    )
  }
}