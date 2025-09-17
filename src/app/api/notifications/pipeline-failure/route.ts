import { NextRequest, NextResponse } from 'next/server'
import { notificationManager } from '@/lib/notification-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      pipelineId, 
      pipelineName, 
      failureReason, 
      stage, 
      severity = 'medium',
      metadata 
    } = body

    if (!pipelineId || !pipelineName || !failureReason) {
      return NextResponse.json(
        { error: 'Missing required parameters: pipelineId, pipelineName, failureReason' },
        { status: 400 }
      )
    }

    const notification = notificationManager.createPipelineFailureNotification(
      pipelineId,
      pipelineName,
      failureReason,
      stage,
      severity,
      metadata || {}
    )

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating pipeline failure notification:', error)
    return NextResponse.json(
      { error: 'Failed to create pipeline failure notification' },
      { status: 500 }
    )
  }
}