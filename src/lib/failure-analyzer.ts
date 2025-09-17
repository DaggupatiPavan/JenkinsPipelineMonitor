// Failure categorization and aggregation system

export interface FailureCategory {
  id: string
  name: string
  description: string
  patterns: string[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  commonCauses: string[]
  suggestedSolutions: string[]
  autoFixAvailable: boolean
}

export interface FailureAnalysis {
  pipelineId: string
  failureReason: string
  category: FailureCategory
  confidence: number
  timestamp: string
  logs: string[]
  affectedStages: string[]
  similarFailures: FailureAnalysis[]
}

export interface FailureStats {
  totalFailures: number
  failuresByCategory: Record<string, {
    count: number
    percentage: number
    avgResolutionTime: number
  }>
  failuresByPipeline: Record<string, {
    count: number
    failureRate: number
    lastFailure: string
  }>
  topFailurePatterns: Array<{
    pattern: string
    count: number
    category: string
  }>
  resolutionTimeStats: {
    average: number
    median: number
    fastest: number
    slowest: number
  }
}

export class FailureAnalyzer {
  private categories: FailureCategory[] = [
    {
      id: 'timeout',
      name: 'Timeout Issues',
      description: 'Builds or stages timing out',
      patterns: ['timeout', 'timed out', 'time limit exceeded', 'deadline exceeded'],
      severity: 'medium',
      commonCauses: [
        'Long-running tests',
        'Network latency',
        'Resource constraints',
        'Inefficient code'
      ],
      suggestedSolutions: [
        'Increase timeout thresholds',
        'Optimize test performance',
        'Add more build resources',
        'Parallelize test execution'
      ],
      autoFixAvailable: true
    },
    {
      id: 'memory',
      name: 'Memory Issues',
      description: 'Out of memory or memory limit exceeded',
      patterns: ['out of memory', 'memory limit', 'oom', 'heap space', 'memory exhausted'],
      severity: 'high',
      commonCauses: [
        'Memory leaks',
        'Large datasets',
        'Insufficient heap allocation',
        'Memory-intensive operations'
      ],
      suggestedSolutions: [
        'Increase memory allocation',
        'Optimize memory usage',
        'Add memory profiling',
        'Implement pagination for large datasets'
      ],
      autoFixAvailable: true
    },
    {
      id: 'network',
      name: 'Network Issues',
      description: 'Network connectivity or DNS resolution failures',
      patterns: ['network', 'connection refused', 'dns', 'timeout', 'unreachable'],
      severity: 'medium',
      commonCauses: [
        'Network configuration issues',
        'Firewall restrictions',
        'DNS resolution failures',
        'Service unavailability'
      ],
      suggestedSolutions: [
        'Check network configuration',
        'Implement retry logic',
        'Add health checks',
        'Use fallback DNS servers'
      ],
      autoFixAvailable: true
    },
    {
      id: 'dependency',
      name: 'Dependency Issues',
      description: 'Problems with dependencies, packages, or libraries',
      patterns: ['dependency', 'package', 'library', 'version conflict', 'compatibility'],
      severity: 'medium',
      commonCauses: [
        'Version conflicts',
        'Missing dependencies',
        'Corrupted packages',
        'Incompatible versions'
      ],
      suggestedSolutions: [
        'Update dependencies',
        'Use dependency locking',
        'Implement dependency checks',
        'Use virtual environments'
      ],
      autoFixAvailable: true
    },
    {
      id: 'permission',
      name: 'Permission Issues',
      description: 'File permissions, access rights, or authorization failures',
      patterns: ['permission', 'access denied', 'unauthorized', 'forbidden', 'read-only'],
      severity: 'medium',
      commonCauses: [
        'Incorrect file permissions',
        'Missing access rights',
        'User configuration issues',
        'Security policy restrictions'
      ],
      suggestedSolutions: [
        'Check file permissions',
        'Update user access rights',
        'Configure security policies',
        'Use service accounts'
      ],
      autoFixAvailable: true
    },
    {
      id: 'disk-space',
      name: 'Disk Space Issues',
      description: 'Insufficient disk space or storage issues',
      patterns: ['disk space', 'no space left', 'storage full', 'quota exceeded'],
      severity: 'high',
      commonCauses: [
        'Insufficient disk space',
        'Large build artifacts',
        'No cleanup process',
        'Log files accumulation'
      ],
      suggestedSolutions: [
        'Clean up disk space',
        'Implement artifact cleanup',
        'Add storage monitoring',
        'Use external storage'
      ],
      autoFixAvailable: true
    },
    {
      id: 'test-failure',
      name: 'Test Failures',
      description: 'Unit tests, integration tests, or E2E test failures',
      patterns: ['test failed', 'assertion', 'test error', 'test suite', 'spec failed'],
      severity: 'low',
      commonCauses: [
        'Code changes breaking tests',
        'Flaky tests',
        'Environment issues',
        'Test data problems'
      ],
      suggestedSolutions: [
        'Update test cases',
        'Fix flaky tests',
        'Improve test environment',
        'Add test data management'
      ],
      autoFixAvailable: false
    },
    {
      id: 'configuration',
      name: 'Configuration Issues',
      description: 'Configuration file, environment variable, or setting issues',
      patterns: ['configuration', 'config', 'environment variable', 'setting', 'property'],
      severity: 'medium',
      commonCauses: [
        'Missing configuration',
        'Incorrect environment variables',
        'Configuration file errors',
        'Environment-specific settings'
      ],
      suggestedSolutions: [
        'Review configuration files',
        'Validate environment variables',
        'Add configuration validation',
        'Use configuration management tools'
      ],
      autoFixAvailable: true
    }
  ]

  categorizeFailure(failureReason: string, logs: string[] = []): FailureCategory | null {
    const text = `${failureReason} ${logs.join(' ')}`.toLowerCase()
    
    for (const category of this.categories) {
      for (const pattern of category.patterns) {
        if (text.includes(pattern.toLowerCase())) {
          return category
        }
      }
    }
    
    return null
  }

  analyzeFailure(
    pipelineId: string,
    failureReason: string,
    logs: string[] = [],
    affectedStages: string[] = [],
    historicalFailures: FailureAnalysis[] = []
  ): FailureAnalysis {
    const category = this.categorizeFailure(failureReason, logs) || {
      id: 'unknown',
      name: 'Unknown Issue',
      description: 'Uncategorized failure',
      patterns: [],
      severity: 'medium' as const,
      commonCauses: ['Unknown cause'],
      suggestedSolutions: ['Manual investigation required'],
      autoFixAvailable: false
    }

    // Find similar failures
    const similarFailures = historicalFailures.filter(failure => 
      failure.category.id === category.id && 
      failure.pipelineId !== pipelineId
    )

    // Calculate confidence based on pattern matching
    const confidence = this.calculateConfidence(failureReason, logs, category)

    return {
      pipelineId,
      failureReason,
      category,
      confidence,
      timestamp: new Date().toISOString(),
      logs,
      affectedStages,
      similarFailures
    }
  }

  private calculateConfidence(failureReason: string, logs: string[], category: FailureCategory): number {
    const text = `${failureReason} ${logs.join(' ')}`.toLowerCase()
    let matchCount = 0

    for (const pattern of category.patterns) {
      if (text.includes(pattern.toLowerCase())) {
        matchCount++
      }
    }

    // Base confidence on number of matching patterns
    const baseConfidence = Math.min(matchCount / category.patterns.length, 1.0)

    // Adjust based on category specificity
    const specificityBonus = category.id === 'unknown' ? 0 : 0.2

    return Math.min(baseConfidence + specificityBonus, 1.0)
  }

  generateFailureStats(failures: FailureAnalysis[]): FailureStats {
    const totalFailures = failures.length

    // Failures by category
    const failuresByCategory: Record<string, any> = {}
    const categoryCounts = failures.reduce((acc, failure) => {
      const categoryId = failure.category.id
      acc[categoryId] = (acc[categoryId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(categoryCounts).forEach(([categoryId, count]) => {
      const categoryFailures = failures.filter(f => f.category.id === categoryId)
      const avgResolutionTime = this.calculateAverageResolutionTime(categoryFailures)
      
      failuresByCategory[categoryId] = {
        count,
        percentage: Math.round((count / totalFailures) * 100),
        avgResolutionTime
      }
    })

    // Failures by pipeline
    const failuresByPipeline: Record<string, any> = {}
    const pipelineCounts = failures.reduce((acc, failure) => {
      const pipelineId = failure.pipelineId
      acc[pipelineId] = (acc[pipelineId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(pipelineCounts).forEach(([pipelineId, count]) => {
      const pipelineFailures = failures.filter(f => f.pipelineId === pipelineId)
      const lastFailure = pipelineFailures.reduce((latest, failure) => 
        failure.timestamp > latest ? failure.timestamp : latest, 
        ''
      )
      
      failuresByPipeline[pipelineId] = {
        count,
        failureRate: Math.round((count / totalFailures) * 100),
        lastFailure
      }
    })

    // Top failure patterns
    const patternCounts = failures.reduce((acc, failure) => {
      failure.category.patterns.forEach(pattern => {
        acc[pattern] = (acc[pattern] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const topFailurePatterns = Object.entries(patternCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([pattern, count]) => ({
        pattern,
        count,
        category: failures.find(f => f.category.patterns.includes(pattern))?.category.name || 'Unknown'
      }))

    // Resolution time statistics
    const resolutionTimes = failures.map(failure => 
      this.calculateResolutionTime(failure)
    ).filter(time => time > 0)

    const resolutionTimeStats = {
      average: resolutionTimes.length > 0 ? 
        Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : 0,
      median: resolutionTimes.length > 0 ? 
        Math.round(resolutionTimes.sort((a, b) => a - b)[Math.floor(resolutionTimes.length / 2)]) : 0,
      fastest: resolutionTimes.length > 0 ? Math.min(...resolutionTimes) : 0,
      slowest: resolutionTimes.length > 0 ? Math.max(...resolutionTimes) : 0
    }

    return {
      totalFailures,
      failuresByCategory,
      failuresByPipeline,
      topFailurePatterns,
      resolutionTimeStats
    }
  }

  private calculateAverageResolutionTime(failures: FailureAnalysis[]): number {
    const resolutionTimes = failures.map(failure => 
      this.calculateResolutionTime(failure)
    ).filter(time => time > 0)

    return resolutionTimes.length > 0 ? 
      Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length) : 0
  }

  private calculateResolutionTime(failure: FailureAnalysis): number {
    // This would typically calculate the time between failure and resolution
    // For now, we'll return a mock value based on category severity
    const severityMultipliers = {
      low: 15,
      medium: 30,
      high: 60,
      critical: 120
    }
    return severityMultipliers[failure.category.severity] || 30
  }

  getSuggestedActions(failureAnalysis: FailureAnalysis): string[] {
    const actions: string[] = []
    
    // Add category-specific solutions
    actions.push(...failureAnalysis.category.suggestedSolutions)
    
    // Add confidence-based actions
    if (failureAnalysis.confidence > 0.8) {
      actions.push('High confidence in categorization - consider automating fix')
    } else if (failureAnalysis.confidence < 0.5) {
      actions.push('Low confidence - manual investigation recommended')
    }
    
    // Add pattern-based actions
    if (failureAnalysis.similarFailures.length > 5) {
      actions.push('Recurring issue detected - consider root cause analysis')
    }
    
    return actions
  }

  getAutoFixScript(failureAnalysis: FailureAnalysis): string | null {
    if (!failureAnalysis.category.autoFixAvailable) {
      return null
    }

    const scripts: Record<string, string> = {
      timeout: `
# Timeout Fix Script
#!/bin/bash
echo "Applying timeout fixes..."

# Increase timeout thresholds
sed -i 's/timeout=300/timeout=600/g' config/*.yml

# Optimize test performance
echo "Optimizing test performance..."
# Add parallel test execution
echo "parallel: true" >> test-config.yml

echo "Timeout fixes applied successfully."
`,
      memory: `
# Memory Fix Script
#!/bin/bash
echo "Applying memory fixes..."

# Increase memory allocation
export JAVA_OPTS="-Xmx4g -Xms2g"
export NODE_OPTIONS="--max-old-space-size=4096"

# Clean up memory
echo "Cleaning up memory..."
sync && echo 3 > /proc/sys/vm/drop_caches

echo "Memory fixes applied successfully."
`,
      network: `
# Network Fix Script
#!/bin/bash
echo "Applying network fixes..."

# Check network connectivity
ping -c 4 8.8.8.8

# Flush DNS cache
echo "Flushing DNS cache..."
sudo systemd-resolve --flush-caches

# Restart network services
echo "Restarting network services..."
sudo systemctl restart NetworkManager

echo "Network fixes applied successfully."
`,
      dependency: `
# Dependency Fix Script
#!/bin/bash
echo "Applying dependency fixes..."

# Update dependencies
echo "Updating dependencies..."
npm update || yarn upgrade || pip install --upgrade

# Clean package cache
echo "Cleaning package cache..."
npm cache clean --force || yarn cache clean || pip cache purge

# Reinstall dependencies
echo "Reinstalling dependencies..."
npm ci || yarn install --frozen-lockfile || pip install -r requirements.txt

echo "Dependency fixes applied successfully."
`
    }

    return scripts[failureAnalysis.category.id] || null
  }
}

// Export singleton instance
export const failureAnalyzer = new FailureAnalyzer()