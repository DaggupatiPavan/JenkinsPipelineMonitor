import { NextRequest, NextResponse } from 'next/server'
import { notificationManager } from '@/lib/notification-manager'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      type: searchParams.get('type') as any || undefined,
      severity: searchParams.get('severity') as any || undefined,
      pipelineId: searchParams.get('pipelineId') || undefined,
      acknowledged: searchParams.get('acknowledged') === 'true' ? true : 
                   searchParams.get('acknowledged') === 'false' ? false : undefined,
      resolved: searchParams.get('resolved') === 'true' ? true : 
                searchParams.get('resolved') === 'false' ? false : undefined,
      assignee: searchParams.get('assignee') || undefined,
      tags: searchParams.get('tags')?.split(',') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined
    }

    const notifications = notificationManager.getNotifications(filters)
    const stats = notificationManager.getNotificationStats()

    return NextResponse.json({
      notifications,
      stats,
      total: notifications.length
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, 
      title, 
      message, 
      severity, 
      pipelineId, 
      pipelineName, 
      stage, 
      metadata 
    } = body

    if (!type || !title || !message || !severity) {
      return NextResponse.json(
        { error: 'Missing required parameters: type, title, message, severity' },
        { status: 400 }
      )
    }

    const notification = notificationManager.createNotification(
      type,
      title,
      message,
      severity,
      pipelineId,
      pipelineName,
      stage,
      metadata || {}
    )

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}