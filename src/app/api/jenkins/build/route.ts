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

    const build = await jenkinsService.getBuildDetails(jobName, parseInt(buildNumber))
    
    // Transform build to match our frontend interface
    const transformedBuild = {
      id: `${jobName}-${build.number}`,
      name: jobName,
      status: jenkinsService.convertBuildStatus(build.result || 'PENDING', build.building),
      duration: Math.floor(build.duration / 60000),
      startTime: new Date(build.timestamp).toISOString(),
      failureStage: build.stages?.find(s => s.status === 'FAILED')?.name || undefined,
      failureReason: jenkinsService.getFailureReason(build),
      developer: jenkinsService.getBuildParameters(build).developer || 'Unknown',
      branch: jenkinsService.getBuildParameters(build).branch || 'main',
      stages: build.stages?.map(stage => ({
        id: `${jobName}-${build.number}-${stage.name}`,
        name: stage.name,
        status: jenkinsService.convertBuildStatus(stage.status, false),
        duration: Math.floor(stage.durationMillis / 60000),
        logs: stage.steps?.map(step => step.log || '').filter(Boolean) || []
      })) || []
    }

    return NextResponse.json(transformedBuild)
  } catch (error) {
    console.error('Error fetching Jenkins build details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch build details' },
      { status: 500 }
    )
  }
}