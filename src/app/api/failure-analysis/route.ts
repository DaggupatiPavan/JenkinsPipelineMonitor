import { NextRequest, NextResponse } from 'next/server'
import { failureAnalyzer } from '@/lib/failure-analyzer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pipelineId, failureReason, logs, affectedStages } = body

    if (!pipelineId || !failureReason) {
      return NextResponse.json(
        { error: 'Missing required parameters: pipelineId and failureReason' },
        { status: 400 }
      )
    }

    const analysis = failureAnalyzer.analyzeFailure(
      pipelineId,
      failureReason,
      logs || [],
      affectedStages || []
    )

    const suggestedActions = failureAnalyzer.getSuggestedActions(analysis)
    const autoFixScript = failureAnalyzer.getAutoFixScript(analysis)

    return NextResponse.json({
      analysis,
      suggestedActions,
      autoFixScript
    })
  } catch (error) {
    console.error('Error analyzing failure:', error)
    return NextResponse.json(
      { error: 'Failed to analyze failure' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const failuresJson = searchParams.get('failures')

    if (!failuresJson) {
      return NextResponse.json(
        { error: 'Missing failures parameter' },
        { status: 400 }
      )
    }

    const failures = JSON.parse(failuresJson)
    const stats = failureAnalyzer.generateFailureStats(failures)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error generating failure stats:', error)
    return NextResponse.json(
      { error: 'Failed to generate failure stats' },
      { status: 500 }
    )
  }
}