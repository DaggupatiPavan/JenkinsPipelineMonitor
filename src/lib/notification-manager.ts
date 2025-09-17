// Notification management and prioritization system

export interface Notification {
  id: string
  type: 'pipeline_failure' | 'pipeline_success' | 'system_alert' | 'maintenance' | 'performance_warning'
  title: string
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  pipelineId?: string
  pipelineName?: string
  stage?: string
  timestamp: string
  acknowledged: boolean
  resolved: boolean
  assignee?: string
  tags: string[]
  actions: NotificationAction[]
  metadata: Record<string, any>
}

export interface NotificationAction {
  id: string
  label: string
  action: 'acknowledge' | 'resolve' | 'assign' | 'restart' | 'view_logs' | 'quick_fix' | 'escalate'
  payload?: Record<string, any>
}

export interface NotificationRule {
  id: string
  name: string
  description: string
  conditions: NotificationCondition[]
  actions: NotificationAction[]
  priority: number
  enabled: boolean
}

export interface NotificationCondition {
  field: 'pipeline_name' | 'failure_reason' | 'stage' | 'severity' | 'branch' | 'developer'
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'regex'
  value: string
}

export interface NotificationStats {
  total: number
  unacknowledged: number
  unresolved: number
  byType: Record<string, number>
  bySeverity: Record<string, number>
  byPipeline: Record<string, number>
  avgResolutionTime: number
  escalationRate: number
}

export class NotificationManager {
  private notifications: Notification[] = []
  private rules: NotificationRule[] = []
  private subscribers: Map<string, (notification: Notification) => void> = new Map()

  constructor() {
    this.initializeDefaultRules()
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'critical_failure',
        name: 'Critical Pipeline Failure',
        description: 'High-priority failures that need immediate attention',
        conditions: [
          { field: 'severity', operator: 'equals', value: 'critical' }
        ],
        actions: [
          { id: 'immediate_alert', label: 'Send Immediate Alert', action: 'escalate' },
          { id: 'assign_lead', label: 'Assign to Lead', action: 'assign' }
        ],
        priority: 1,
        enabled: true
      },
      {
        id: 'recurring_failure',
        name: 'Recurring Failure',
        description: 'Failures that happen repeatedly on the same pipeline',
        conditions: [
          { field: 'failure_reason', operator: 'contains', value: 'timeout' }
        ],
        actions: [
          { id: 'auto_fix', label: 'Apply Auto Fix', action: 'quick_fix' },
          { id: 'assign_team', label: 'Assign to Team', action: 'assign' }
        ],
        priority: 2,
        enabled: true
      },
      {
        id: 'test_failure',
        name: 'Test Failure',
        description: 'Test-related failures with medium priority',
        conditions: [
          { field: 'stage', operator: 'contains', value: 'test' }
        ],
        actions: [
          { id: 'notify_developer', label: 'Notify Developer', action: 'assign' }
        ],
        priority: 3,
        enabled: true
      },
      {
        id: 'performance_warning',
        name: 'Performance Warning',
        description: 'Pipeline performance degradation',
        conditions: [
          { field: 'failure_reason', operator: 'contains', value: 'slow' }
        ],
        actions: [
          { id: 'monitor', label: 'Monitor Performance', action: 'acknowledge' }
        ],
        priority: 4,
        enabled: true
      }
    ]
  }

  createNotification(
    type: Notification['type'],
    title: string,
    message: string,
    severity: Notification['severity'],
    pipelineId?: string,
    pipelineName?: string,
    stage?: string,
    metadata: Record<string, any> = {}
  ): Notification {
    const notification: Notification = {
      id: this.generateId(),
      type,
      title,
      message,
      severity,
      pipelineId,
      pipelineName,
      stage,
      timestamp: new Date().toISOString(),
      acknowledged: false,
      resolved: false,
      tags: this.generateTags(type, severity, pipelineName, stage),
      actions: this.generateActions(type, severity, pipelineId),
      metadata
    }

    this.notifications.push(notification)
    this.processRules(notification)
    this.notifySubscribers(notification)

    return notification
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateTags(
    type: Notification['type'],
    severity: Notification['severity'],
    pipelineName?: string,
    stage?: string
  ): string[] {
    const tags: string[] = [type, severity]
    
    if (pipelineName) {
      tags.push(pipelineName.toLowerCase().replace(/\s+/g, '_'))
    }
    
    if (stage) {
      tags.push(stage.toLowerCase().replace(/\s+/g, '_'))
    }

    // Add smart tags based on content
    if (severity === 'critical' || severity === 'high') {
      tags.push('urgent')
    }
    
    if (type === 'pipeline_failure') {
      tags.push('needs_attention')
    }

    return tags
  }

  private generateActions(
    type: Notification['type'],
    severity: Notification['severity'],
    pipelineId?: string
  ): NotificationAction[] {
    const actions: NotificationAction[] = [
      { id: 'acknowledge', label: 'Acknowledge', action: 'acknowledge' }
    ]

    if (type === 'pipeline_failure') {
      actions.push(
        { id: 'view_logs', label: 'View Logs', action: 'view_logs', payload: { pipelineId } },
        { id: 'restart', label: 'Restart Pipeline', action: 'restart', payload: { pipelineId } }
      )
    }

    if (severity === 'high' || severity === 'critical') {
      actions.push(
        { id: 'escalate', label: 'Escalate', action: 'escalate' }
      )
    }

    if (type === 'pipeline_failure') {
      actions.push(
        { id: 'quick_fix', label: 'Quick Fix', action: 'quick_fix', payload: { pipelineId } }
      )
    }

    actions.push(
      { id: 'resolve', label: 'Resolve', action: 'resolve' }
    )

    return actions
  }

  private processRules(notification: Notification) {
    for (const rule of this.rules.filter(r => r.enabled)) {
      if (this.matchesConditions(notification, rule.conditions)) {
        // Execute rule actions
        this.executeRuleActions(notification, rule)
        break // Only apply the first matching rule (highest priority)
      }
    }
  }

  private matchesConditions(notification: Notification, conditions: NotificationCondition[]): boolean {
    return conditions.every(condition => {
      const fieldValue = this.getFieldValue(notification, condition.field)
      return this.evaluateCondition(fieldValue, condition.operator, condition.value)
    })
  }

  private getFieldValue(notification: Notification, field: NotificationCondition['field']): string {
    switch (field) {
      case 'pipeline_name':
        return notification.pipelineName || ''
      case 'failure_reason':
        return notification.message
      case 'stage':
        return notification.stage || ''
      case 'severity':
        return notification.severity
      case 'branch':
        return notification.metadata.branch || ''
      case 'developer':
        return notification.metadata.developer || ''
      default:
        return ''
    }
  }

  private evaluateCondition(fieldValue: string, operator: NotificationCondition['operator'], value: string): boolean {
    const field = fieldValue.toLowerCase()
    const val = value.toLowerCase()

    switch (operator) {
      case 'equals':
        return field === val
      case 'contains':
        return field.includes(val)
      case 'starts_with':
        return field.startsWith(val)
      case 'ends_with':
        return field.endsWith(val)
      case 'regex':
        try {
          return new RegExp(val).test(field)
        } catch {
          return false
        }
      default:
        return false
    }
  }

  private executeRuleActions(notification: Notification, rule: NotificationRule) {
    // Add rule-specific actions to the notification
    rule.actions.forEach(action => {
      if (!notification.actions.find(a => a.id === action.id)) {
        notification.actions.push(action)
      }
    })

    // Auto-acknowledge for low-priority rules
    if (rule.priority > 3) {
      notification.acknowledged = true
    }
  }

  acknowledgeNotification(notificationId: string, userId?: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.acknowledged = true
      notification.metadata.acknowledgedBy = userId
      notification.metadata.acknowledgedAt = new Date().toISOString()
      return true
    }
    return false
  }

  resolveNotification(notificationId: string, userId?: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.resolved = true
      notification.metadata.resolvedBy = userId
      notification.metadata.resolvedAt = new Date().toISOString()
      return true
    }
    return false
  }

  assignNotification(notificationId: string, assignee: string, userId?: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.assignee = assignee
      notification.metadata.assignedBy = userId
      notification.metadata.assignedAt = new Date().toISOString()
      return true
    }
    return false
  }

  getNotifications(filters: {
    type?: Notification['type']
    severity?: Notification['severity']
    pipelineId?: string
    acknowledged?: boolean
    resolved?: boolean
    assignee?: string
    tags?: string[]
    limit?: number
    offset?: number
  } = {}): Notification[] {
    let filtered = [...this.notifications]

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(n => n.type === filters.type)
    }
    if (filters.severity) {
      filtered = filtered.filter(n => n.severity === filters.severity)
    }
    if (filters.pipelineId) {
      filtered = filtered.filter(n => n.pipelineId === filters.pipelineId)
    }
    if (filters.acknowledged !== undefined) {
      filtered = filtered.filter(n => n.acknowledged === filters.acknowledged)
    }
    if (filters.resolved !== undefined) {
      filtered = filtered.filter(n => n.resolved === filters.resolved)
    }
    if (filters.assignee) {
      filtered = filtered.filter(n => n.assignee === filters.assignee)
    }
    if (filters.tags) {
      filtered = filtered.filter(n => 
        filters.tags!.every(tag => n.tags.includes(tag))
      )
    }

    // Sort by timestamp (newest first) and severity
    filtered.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity]
      if (severityDiff !== 0) return severityDiff
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    // Apply pagination
    if (filters.offset) {
      filtered = filtered.slice(filters.offset)
    }
    if (filters.limit) {
      filtered = filtered.slice(0, filters.limit)
    }

    return filtered
  }

  getNotificationStats(): NotificationStats {
    const total = this.notifications.length
    const unacknowledged = this.notifications.filter(n => !n.acknowledged).length
    const unresolved = this.notifications.filter(n => !n.resolved).length

    const byType = this.notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const bySeverity = this.notifications.reduce((acc, n) => {
      acc[n.severity] = (acc[n.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byPipeline = this.notifications.reduce((acc, n) => {
      if (n.pipelineName) {
        acc[n.pipelineName] = (acc[n.pipelineName] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)

    // Calculate average resolution time
    const resolvedNotifications = this.notifications.filter(n => n.resolved && n.metadata.resolvedAt)
    const avgResolutionTime = resolvedNotifications.length > 0 ? 
      resolvedNotifications.reduce((sum, n) => {
        const resolutionTime = new Date(n.metadata.resolvedAt).getTime() - new Date(n.timestamp).getTime()
        return sum + resolutionTime
      }, 0) / resolvedNotifications.length / 60000 : 0 // Convert to minutes

    // Calculate escalation rate
    const escalatedNotifications = this.notifications.filter(n => 
      n.actions.some(a => a.action === 'escalate')
    )
    const escalationRate = total > 0 ? (escalatedNotifications.length / total) * 100 : 0

    return {
      total,
      unacknowledged,
      unresolved,
      byType,
      bySeverity,
      byPipeline,
      avgResolutionTime: Math.round(avgResolutionTime),
      escalationRate: Math.round(escalationRate)
    }
  }

  subscribe(callback: (notification: Notification) => void): string {
    const id = this.generateId()
    this.subscribers.set(id, callback)
    return id
  }

  unsubscribe(subscriptionId: string): void {
    this.subscribers.delete(subscriptionId)
  }

  private notifySubscribers(notification: Notification) {
    this.subscribers.forEach(callback => {
      try {
        callback(notification)
      } catch (error) {
        console.error('Error in notification subscriber:', error)
      }
    })
  }

  createPipelineFailureNotification(
    pipelineId: string,
    pipelineName: string,
    failureReason: string,
    stage?: string,
    severity: Notification['severity'] = 'medium',
    metadata: Record<string, any> = {}
  ): Notification {
    return this.createNotification(
      'pipeline_failure',
      `Pipeline Failed: ${pipelineName}`,
      failureReason,
      severity,
      pipelineId,
      pipelineName,
      stage,
      metadata
    )
  }

  createPipelineSuccessNotification(
    pipelineId: string,
    pipelineName: string,
    metadata: Record<string, any> = {}
  ): Notification {
    return this.createNotification(
      'pipeline_success',
      `Pipeline Success: ${pipelineName}`,
      `Pipeline ${pipelineName} completed successfully`,
      'low',
      pipelineId,
      pipelineName,
      undefined,
      metadata
    )
  }

  createSystemAlertNotification(
    title: string,
    message: string,
    severity: Notification['severity'] = 'medium',
    metadata: Record<string, any> = {}
  ): Notification {
    return this.createNotification(
      'system_alert',
      title,
      message,
      severity,
      undefined,
      undefined,
      undefined,
      metadata
    )
  }

  // Cleanup old notifications (older than 30 days)
  cleanup(): void {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    this.notifications = this.notifications.filter(n => 
      new Date(n.timestamp) > thirtyDaysAgo
    )
  }
}

// Export singleton instance
export const notificationManager = new NotificationManager()