import { NextRequest, NextResponse } from 'next/server'
import { jenkinsService } from '@/lib/jenkins'

export async function POST(request: NextRequest) {
  try {
    const { url, username, apiToken } = await request.json()

    if (!url || !username || !apiToken) {
      return NextResponse.json(
        { error: 'Missing Jenkins configuration parameters' },
        { status: 400 }
      )
    }

    // Set configuration for this request
    jenkinsService.setConfig({
      url,
      username,
      apiToken
    })

    // Test the connection
    const result = await jenkinsService.testConnection()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error testing Jenkins connection:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to test Jenkins connection' },
      { status: 500 }
    )
  }
}