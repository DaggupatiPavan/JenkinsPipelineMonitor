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

    const queue = await jenkinsService.getQueue()
    
    return NextResponse.json(queue)
  } catch (error) {
    console.error('Error fetching Jenkins queue:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Jenkins queue' },
      { status: 500 }
    )
  }
}