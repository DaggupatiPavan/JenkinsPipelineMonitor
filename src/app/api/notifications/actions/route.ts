import { NextRequest, NextResponse } from 'next/server'
import { notificationManager } from '@/lib/notification-manager'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, notificationId, userId, ...payload } = body

    if (!action || !notificationId) {
      return NextResponse.json(
        { error: 'Missing required parameters: action, notificationId' },
        { status: 400 }
      )
    }

    let result = false
    let message = ''

    switch (action) {
      case 'acknowledge':
        result = notificationManager.acknowledgeNotification(notificationId, userId)
        message = result ? 'Notification acknowledged successfully' : 'Notification not found'
        break

      case 'resolve':
        result = notificationManager.resolveNotification(notificationId, userId)
        message = result ? 'Notification resolved successfully' : 'Notification not found'
        break

      case 'assign':
        if (!payload.assignee) {
          return NextResponse.json(
            { error: 'Missing assignee parameter' },
            { status: 400 }
          )
        }
        result = notificationManager.assignNotification(notificationId, payload.assignee, userId)
        message = result ? 'Notification assigned successfully' : 'Notification not found'
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (!result) {
      return NextResponse.json(
        { error: message },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message,
      action,
      notificationId
    })
  } catch (error) {
    console.error('Error performing notification action:', error)
    return NextResponse.json(
      { error: 'Failed to perform notification action' },
      { status: 500 }
    )
  }
}