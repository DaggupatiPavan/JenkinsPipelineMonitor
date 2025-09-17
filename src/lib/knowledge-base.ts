// Common solutions knowledge base for frequent failures

export interface SolutionTemplate {
  id: string
  title: string
  description: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  problemPatterns: string[]
  symptoms: string[]
  rootCauses: string[]
  solutions: SolutionStep[]
  prevention: PreventionStep[]
  estimatedFixTime: number // in minutes
  successRate: number // percentage
  tags: string[]
  relatedFailures: string[]
  lastUpdated: string
  version: number
  author: string
  verified: boolean
  autoFixAvailable: boolean
  autoFixScript?: string
}

export interface SolutionStep {
  id: string
  title: string
  description: string
  command?: string
  code?: string
  files?: string[]
  verification?: string
  rollback?: string
  risk: 'low' | 'medium' | 'high'
  required: boolean
}

export interface PreventionStep {
  id: string
  title: string
  description: string
  implementation: string
  monitoring?: string
  schedule?: string
}

export interface FailurePattern {
  id: string
  name: string
  description: string
  regex: string
  category: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  frequency: number
  lastSeen: string
  solutionId?: string
}

export interface KnowledgeBaseStats {
  totalSolutions: number
  solutionsByCategory: Record<string, number>
  solutionsBySeverity: Record<string, number>
  averageFixTime: number
  topSuccessRate: number
  verifiedSolutions: number
  autoFixAvailable: number
  commonPatterns: FailurePattern[]
}

export class KnowledgeBase {
  private solutions: SolutionTemplate[] = []
  private patterns: FailurePattern[] = []

  constructor() {
    this.initializeDefaultSolutions()
    this.initializeDefaultPatterns()
  }

  private initializeDefaultSolutions() {
    this.solutions = [
      {
        id: 'timeout_fix',
        title: 'Pipeline Timeout Issues',
        description: 'Comprehensive solution for Jenkins pipeline timeout problems',
        category: 'timeout',
        severity: 'medium',
        problemPatterns: ['timeout', 'timed out', 'time limit exceeded'],
        symptoms: [
          'Builds fail after specific time limit',
          'Stages timeout during execution',
          'Agent becomes unresponsive',
          'Build hangs indefinitely'
        ],
        rootCauses: [
          'Insufficient timeout configuration',
          'Long-running test suites',
          'Network latency issues',
          'Resource constraints',
          'Inefficient build processes'
        ],
        solutions: [
          {
            id: 'increase_timeout',
            title: 'Increase Timeout Values',
            description: 'Configure appropriate timeout values for pipeline stages',
            command: 'sed -i \'s/timeout=30/timeout=120/g\' Jenkinsfile',
            risk: 'low',
            required: true
          },
          {
            id: 'optimize_tests',
            title: 'Optimize Test Execution',
            description: 'Improve test performance and parallelization',
            code: `// Parallel test execution
pipeline {
    agent any
    stages {
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'mvn test -Dparallel=classes'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'mvn integration-test -Dparallel=methods'
                    }
                }
            }
        }
    }
}`,
            risk: 'medium',
            required: true
          },
          {
            id: 'add_resources',
            title: 'Increase Build Resources',
            description: 'Allocate more memory and CPU to build agents',
            command: 'kubectl set resources deployment jenkins-agent --limits=cpu=2,memory=4Gi',
            risk: 'low',
            required: false
          }
        ],
        prevention: [
          {
            id: 'monitor_performance',
            title: 'Performance Monitoring',
            description: 'Implement build performance monitoring',
            implementation: 'Add build timing metrics to Prometheus',
            monitoring: 'Alert on builds exceeding 80% of timeout',
            schedule: 'Daily performance review'
          },
          {
            id: 'regular_cleanup',
            title: 'Regular Cleanup',
            description: 'Implement workspace and artifact cleanup',
            implementation: 'Add cleanWs() step to pipeline',
            schedule: 'After each build'
          }
        ],
        estimatedFixTime: 30,
        successRate: 85,
        tags: ['timeout', 'performance', 'configuration'],
        relatedFailures: ['memory_issues', 'network_problems'],
        lastUpdated: new Date().toISOString(),
        version: 2,
        author: 'DevOps Team',
        verified: true,
        autoFixAvailable: true,
        autoFixScript: `#!/bin/bash
# Timeout Fix Script
echo "Applying timeout fixes..."

# Backup original files
cp Jenkinsfile Jenkinsfile.backup

# Increase timeout values
sed -i 's/timeout: [0-9]*/timeout: 120/g' Jenkinsfile

# Add parallel execution if not present
if ! grep -q "parallel {" Jenkinsfile; then
    sed -i '/stage.*Test.*/a\\        parallel {' Jenkinsfile
    sed -i '/stage.*Test.*/N;s/.*\\n/        }\n&/' Jenkinsfile
fi

echo "Timeout fixes applied successfully."
echo "Please review and commit the changes."
`
      },
      {
        id: 'memory_fix',
        title: 'Memory Issues Resolution',
        description: 'Complete solution for out-of-memory and memory limit problems',
        category: 'memory',
        severity: 'high',
        problemPatterns: ['out of memory', 'memory limit', 'oom', 'heap space'],
        symptoms: [
          'Build fails with OutOfMemoryError',
          'JVM heap space exhausted',
          'Container memory limits exceeded',
          'Build agent becomes unresponsive'
        ],
        rootCauses: [
          'Insufficient JVM heap allocation',
          'Memory leaks in build process',
          'Large file processing',
          'Too many concurrent processes',
          'Inefficient memory usage'
        ],
        solutions: [
          {
            id: 'increase_heap',
            title: 'Increase JVM Heap Size',
            description: 'Configure appropriate JVM memory settings',
            code: `export JAVA_OPTS="-Xmx4g -Xms2g -XX:+UseG1GC"
export MAVEN_OPTS="-Xmx2g -Xms1g"
export GRADLE_OPTS="-Xmx2g -Xms1g"`,
            risk: 'low',
            required: true
          },
          {
            id: 'container_limits',
            title: 'Adjust Container Memory Limits',
            description: 'Update Kubernetes pod memory limits',
            command: 'kubectl set resources deployment jenkins-agent --limits=memory=8Gi --requests=memory=4Gi',
            risk: 'medium',
            required: true
          },
          {
            id: 'memory_profiling',
            title: 'Add Memory Profiling',
            description: 'Implement memory usage monitoring',
            code: `// Add memory monitoring to pipeline
stage('Memory Profile') {
    steps {
        sh '''
        echo "Memory usage before build:"
        free -h
        ps aux --sort=-%mem | head -10
        '''
    }
}`,
            risk: 'low',
            required: false
          }
        ],
        prevention: [
          {
            id: 'memory_monitoring',
            title: 'Memory Usage Monitoring',
            description: 'Implement continuous memory monitoring',
            implementation: 'Add Prometheus memory metrics collection',
            monitoring: 'Alert when memory usage > 80%',
            schedule: 'Real-time monitoring'
          },
          {
            id: 'regular_gc',
            title: 'Regular Garbage Collection',
            description: 'Optimize JVM garbage collection',
            implementation: 'Configure G1GC with appropriate settings',
            monitoring: 'Monitor GC pause times',
            schedule: 'Continuous'
          }
        ],
        estimatedFixTime: 45,
        successRate: 92,
        tags: ['memory', 'jvm', 'performance'],
        relatedFailures: ['timeout_issues', 'performance_problems'],
        lastUpdated: new Date().toISOString(),
        version: 3,
        author: 'DevOps Team',
        verified: true,
        autoFixAvailable: true,
        autoFixScript: `#!/bin/bash
# Memory Fix Script
echo "Applying memory fixes..."

# Set environment variables
echo 'export JAVA_OPTS="-Xmx4g -Xms2g -XX:+UseG1GC"' >> ~/.bashrc
echo 'export MAVEN_OPTS="-Xmx2g -Xms1g"' >> ~/.bashrc
echo 'export GRADLE_OPTS="-Xmx2g -Xms1g"' >> ~/.bashrc

# Update Kubernetes deployment if available
if command -v kubectl &> /dev/null; then
    kubectl set resources deployment jenkins-agent --limits=memory=8Gi --requests=memory=4Gi
fi

# Clean up memory
sync && echo 3 > /proc/sys/vm/drop_caches

echo "Memory fixes applied successfully."
echo "Please restart your build environment."
`
      },
      {
        id: 'dependency_fix',
        title: 'Dependency Resolution Issues',
        description: 'Complete solution for dependency conflicts and resolution problems',
        category: 'dependency',
        severity: 'medium',
        problemPatterns: ['dependency', 'version conflict', 'compatibility', 'unable to resolve'],
        symptoms: [
          'Build fails with dependency errors',
          'Version conflicts between libraries',
          'Unable to download dependencies',
          'Artifact resolution failures'
        ],
        rootCauses: [
          'Incompatible library versions',
          'Corrupted dependency cache',
          'Network connectivity issues',
          'Missing or incorrect repositories',
          'Transitive dependency conflicts'
        ],
        solutions: [
          {
            id: 'clean_cache',
            title: 'Clean Dependency Cache',
            description: 'Clear all dependency caches and redownload',
            command: 'mvn clean && rm -rf ~/.m2/repository && mvn dependency:resolve',
            risk: 'low',
            required: true
          },
          {
            id: 'lock_versions',
            title: 'Implement Dependency Locking',
            description: 'Use dependency locking to ensure consistent versions',
            code: `# Maven dependency lock
mvn dependency:lock

# Gradle dependency lock
gradle dependencies --write-locks

# NPM package lock
npm shrinkwrap`,
            risk: 'low',
            required: true
          },
          {
            id: 'update_versions',
            title: 'Update Dependency Versions',
            description: 'Update to compatible versions of conflicting libraries',
            command: 'mvn versions:use-latest-versions',
            risk: 'medium',
            required: false
          }
        ],
        prevention: [
          {
            id: 'dependency_scanning',
            title: 'Dependency Scanning',
            description: 'Implement regular dependency vulnerability scanning',
            implementation: 'Integrate OWASP Dependency Check',
            monitoring: 'Alert on vulnerable dependencies',
            schedule: 'Weekly scans'
          },
          {
            id: 'version_policies',
            title: 'Version Management Policies',
            description: 'Establish clear dependency version management',
            implementation: 'Create dependency management configuration',
            monitoring: 'Review dependency updates monthly',
            schedule: 'Monthly reviews'
          }
        ],
        estimatedFixTime: 60,
        successRate: 88,
        tags: ['dependency', 'maven', 'gradle', 'npm'],
        relatedFailures: ['build_failures', 'version_conflicts'],
        lastUpdated: new Date().toISOString(),
        version: 2,
        author: 'DevOps Team',
        verified: true,
        autoFixAvailable: true,
        autoFixScript: `#!/bin/bash
# Dependency Fix Script
echo "Applying dependency fixes..."

# Detect build system
if [ -f "pom.xml" ]; then
    echo "Maven project detected"
    mvn clean
    rm -rf ~/.m2/repository
    mvn dependency:resolve
    mvn dependency:lock
elif [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
    echo "Gradle project detected"
    ./gradlew clean
    rm -rf ~/.gradle/caches
    ./gradlew dependencies --write-locks
elif [ -f "package.json" ]; then
    echo "NPM project detected"
    npm cache clean --force
    rm -rf node_modules package-lock.json
    npm install
    npm shrinkwrap
fi

echo "Dependency fixes applied successfully."
echo "Please commit the generated lock files."
`
      },
      {
        id: 'network_fix',
        title: 'Network Connectivity Issues',
        description: 'Comprehensive solution for network-related build failures',
        category: 'network',
        severity: 'medium',
        problemPatterns: ['network', 'connection refused', 'unreachable', 'dns'],
        symptoms: [
          'Unable to connect to external services',
          'DNS resolution failures',
          'Connection timeout errors',
          'Proxy authentication issues'
        ],
        rootCauses: [
          'Network configuration problems',
          'Firewall restrictions',
          'DNS server issues',
          'Proxy configuration errors',
          'Service unavailability'
        ],
        solutions: [
          {
            id: 'check_connectivity',
            title: 'Test Network Connectivity',
            description: 'Verify basic network connectivity',
            command: 'ping -c 4 8.8.8.8 && nslookup google.com',
            risk: 'low',
            required: true
          },
          {
            id: 'flush_dns',
            title: 'Flush DNS Cache',
            description: 'Clear DNS resolver cache',
            command: 'sudo systemd-resolve --flush-caches || sudo service nscd restart',
            risk: 'low',
            required: true
          },
          {
            id: 'configure_proxy',
            title: 'Configure Proxy Settings',
            description: 'Set up proper proxy configuration',
            code: `export HTTP_PROXY="http://proxy.company.com:8080"
export HTTPS_PROXY="http://proxy.company.com:8080"
export NO_PROXY="localhost,127.0.0.1,*.local"`,
            risk: 'medium',
            required: false
          }
        ],
        prevention: [
          {
            id: 'network_monitoring',
            title: 'Network Health Monitoring',
            description: 'Implement continuous network monitoring',
            implementation: 'Set up network connectivity checks',
            monitoring: 'Alert on network failures',
            schedule: 'Every 5 minutes'
          },
          {
            id: 'redundant_dns',
            title: 'Redundant DNS Configuration',
            description: 'Configure multiple DNS servers',
            implementation: 'Update /etc/resolv.conf with multiple DNS servers',
            monitoring: 'Monitor DNS resolution times',
            schedule: 'Continuous'
          }
        ],
        estimatedFixTime: 20,
        successRate: 78,
        tags: ['network', 'dns', 'proxy', 'connectivity'],
        relatedFailures: ['external_services', 'timeout_issues'],
        lastUpdated: new Date().toISOString(),
        version: 1,
        author: 'DevOps Team',
        verified: true,
        autoFixAvailable: true,
        autoFixScript: `#!/bin/bash
# Network Fix Script
echo "Applying network fixes..."

# Test basic connectivity
echo "Testing network connectivity..."
ping -c 4 8.8.8.8
nslookup google.com

# Flush DNS cache
echo "Flushing DNS cache..."
if command -v systemd-resolve &> /dev/null; then
    sudo systemd-resolve --flush-caches
elif command -v nscd &> /dev/null; then
    sudo service nscd restart
fi

# Check and restart network services
echo "Restarting network services..."
sudo systemctl restart NetworkManager 2>/dev/null || \
sudo systemctl restart network 2>/dev/null || \
echo "Network service restart skipped"

echo "Network fixes applied successfully."
echo "Please test your connectivity."
`
      }
    ]
  }

  private initializeDefaultPatterns() {
    this.patterns = [
      {
        id: 'timeout_pattern',
        name: 'Build Timeout',
        description: 'Pipeline or stage timeout occurrences',
        regex: '(timeout|timed out|time limit exceeded)',
        category: 'timeout',
        severity: 'medium',
        frequency: 15,
        lastSeen: new Date().toISOString(),
        solutionId: 'timeout_fix'
      },
      {
        id: 'memory_pattern',
        name: 'Memory Issues',
        description: 'Out-of-memory and memory limit problems',
        regex: '(out of memory|memory limit|oom|heap space)',
        category: 'memory',
        severity: 'high',
        frequency: 8,
        lastSeen: new Date().toISOString(),
        solutionId: 'memory_fix'
      },
      {
        id: 'dependency_pattern',
        name: 'Dependency Problems',
        description: 'Dependency resolution and version conflicts',
        regex: '(dependency|version conflict|unable to resolve)',
        category: 'dependency',
        severity: 'medium',
        frequency: 12,
        lastSeen: new Date().toISOString(),
        solutionId: 'dependency_fix'
      },
      {
        id: 'network_pattern',
        name: 'Network Issues',
        description: 'Network connectivity and DNS problems',
        regex: '(network|connection refused|unreachable|dns)',
        category: 'network',
        severity: 'medium',
        frequency: 6,
        lastSeen: new Date().toISOString(),
        solutionId: 'network_fix'
      }
    ]
  }

  findSolutions(failureReason: string, logs: string[] = []): SolutionTemplate[] {
    const text = `${failureReason} ${logs.join(' ')}`.toLowerCase()
    
    return this.solutions.filter(solution => 
      solution.problemPatterns.some(pattern => 
        text.includes(pattern.toLowerCase())
      )
    ).sort((a, b) => b.successRate - a.successRate)
  }

  getSolution(id: string): SolutionTemplate | undefined {
    return this.solutions.find(solution => solution.id === id)
  }

  getAllSolutions(): SolutionTemplate[] {
    return this.solutions.sort((a, b) => {
      if (a.severity !== b.severity) {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      }
      return b.successRate - a.successRate
    })
  }

  getSolutionsByCategory(category: string): SolutionTemplate[] {
    return this.solutions.filter(solution => solution.category === category)
  }

  getSolutionsBySeverity(severity: string): SolutionTemplate[] {
    return this.solutions.filter(solution => solution.severity === severity)
  }

  searchSolutions(query: string): SolutionTemplate[] {
    const searchText = query.toLowerCase()
    
    return this.solutions.filter(solution => 
      solution.title.toLowerCase().includes(searchText) ||
      solution.description.toLowerCase().includes(searchText) ||
      solution.problemPatterns.some(pattern => pattern.toLowerCase().includes(searchText)) ||
      solution.tags.some(tag => tag.toLowerCase().includes(searchText))
    )
  }

  getAutoFixScript(failureReason: string): string | null {
    const solutions = this.findSolutions(failureReason)
    return solutions[0]?.autoFixScript || null
  }

  addSolution(solution: Omit<SolutionTemplate, 'id' | 'lastUpdated' | 'version'>): SolutionTemplate {
    const newSolution: SolutionTemplate = {
      ...solution,
      id: this.generateId(),
      lastUpdated: new Date().toISOString(),
      version: 1
    }
    
    this.solutions.push(newSolution)
    return newSolution
  }

  updateSolution(id: string, updates: Partial<SolutionTemplate>): SolutionTemplate | null {
    const solutionIndex = this.solutions.findIndex(s => s.id === id)
    if (solutionIndex === -1) return null

    this.solutions[solutionIndex] = {
      ...this.solutions[solutionIndex],
      ...updates,
      lastUpdated: new Date().toISOString(),
      version: this.solutions[solutionIndex].version + 1
    }

    return this.solutions[solutionIndex]
  }

  deleteSolution(id: string): boolean {
    const solutionIndex = this.solutions.findIndex(s => s.id === id)
    if (solutionIndex === -1) return false

    this.solutions.splice(solutionIndex, 1)
    return true
  }

  recognizeFailurePattern(text: string): FailurePattern | null {
    for (const pattern of this.patterns) {
      try {
        const regex = new RegExp(pattern.regex, 'i')
        if (regex.test(text)) {
          return pattern
        }
      } catch (error) {
        console.error(`Invalid regex pattern: ${pattern.regex}`, error)
      }
    }
    return null
  }

  addFailurePattern(pattern: Omit<FailurePattern, 'id' | 'lastSeen'>): FailurePattern {
    const newPattern: FailurePattern = {
      ...pattern,
      id: this.generateId(),
      lastSeen: new Date().toISOString()
    }
    
    this.patterns.push(newPattern)
    return newPattern
  }

  updateFailurePatternFrequency(id: string): boolean {
    const pattern = this.patterns.find(p => p.id === id)
    if (!pattern) return false

    pattern.frequency += 1
    pattern.lastSeen = new Date().toISOString()
    return true
  }

  getStats(): KnowledgeBaseStats {
    const totalSolutions = this.solutions.length
    const solutionsByCategory = this.solutions.reduce((acc, solution) => {
      acc[solution.category] = (acc[solution.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const solutionsBySeverity = this.solutions.reduce((acc, solution) => {
      acc[solution.severity] = (acc[solution.severity] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const averageFixTime = this.solutions.length > 0 ? 
      this.solutions.reduce((sum, solution) => sum + solution.estimatedFixTime, 0) / this.solutions.length : 0

    const topSuccessRate = this.solutions.length > 0 ? 
      Math.max(...this.solutions.map(s => s.successRate)) : 0

    const verifiedSolutions = this.solutions.filter(s => s.verified).length
    const autoFixAvailable = this.solutions.filter(s => s.autoFixAvailable).length

    const commonPatterns = this.patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10)

    return {
      totalSolutions,
      solutionsByCategory,
      solutionsBySeverity,
      averageFixTime: Math.round(averageFixTime),
      topSuccessRate,
      verifiedSolutions,
      autoFixAvailable,
      commonPatterns
    }
  }

  private generateId(): string {
    return `sol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Export/Import functionality
  exportSolutions(): string {
    return JSON.stringify({
      solutions: this.solutions,
      patterns: this.patterns,
      exportedAt: new Date().toISOString()
    }, null, 2)
  }

  importSolutions(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      if (data.solutions) {
        this.solutions = data.solutions
      }
      if (data.patterns) {
        this.patterns = data.patterns
      }
      return true
    } catch (error) {
      console.error('Failed to import knowledge base:', error)
      return false
    }
  }
}

// Export singleton instance
export const knowledgeBase = new KnowledgeBase()