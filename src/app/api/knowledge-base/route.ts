import { NextRequest, NextResponse } from 'next/server'
import { knowledgeBase } from '@/lib/knowledge-base'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const query = searchParams.get('query')
    const category = searchParams.get('category')
    const severity = searchParams.get('severity')

    if (action === 'stats') {
      const stats = knowledgeBase.getStats()
      return NextResponse.json(stats)
    }

    if (action === 'search' && query) {
      const solutions = knowledgeBase.searchSolutions(query)
      return NextResponse.json(solutions)
    }

    if (action === 'category' && category) {
      const solutions = knowledgeBase.getSolutionsByCategory(category)
      return NextResponse.json(solutions)
    }

    if (action === 'severity' && severity) {
      const solutions = knowledgeBase.getSolutionsBySeverity(severity)
      return NextResponse.json(solutions)
    }

    // Return all solutions by default
    const solutions = knowledgeBase.getAllSolutions()
    return NextResponse.json(solutions)
  } catch (error) {
    console.error('Error fetching knowledge base:', error)
    return NextResponse.json(
      { error: 'Failed to fetch knowledge base' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    if (action === 'find-solutions') {
      const { failureReason, logs } = data
      const solutions = knowledgeBase.findSolutions(failureReason, logs || [])
      return NextResponse.json(solutions)
    }

    if (action === 'add-solution') {
      const solution = knowledgeBase.addSolution(data)
      return NextResponse.json(solution)
    }

    if (action === 'get-autofix') {
      const { failureReason } = data
      const script = knowledgeBase.getAutoFixScript(failureReason)
      return NextResponse.json({ script })
    }

    if (action === 'recognize-pattern') {
      const { text } = data
      const pattern = knowledgeBase.recognizeFailurePattern(text)
      return NextResponse.json(pattern)
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error processing knowledge base request:', error)
    return NextResponse.json(
      { error: 'Failed to process knowledge base request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    const solution = knowledgeBase.updateSolution(id, updates)
    if (!solution) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(solution)
  } catch (error) {
    console.error('Error updating solution:', error)
    return NextResponse.json(
      { error: 'Failed to update solution' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing solution ID' },
        { status: 400 }
      )
    }

    const success = knowledgeBase.deleteSolution(id)
    if (!success) {
      return NextResponse.json(
        { error: 'Solution not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting solution:', error)
    return NextResponse.json(
      { error: 'Failed to delete solution' },
      { status: 500 }
    )
  }
}