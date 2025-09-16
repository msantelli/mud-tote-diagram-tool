import { describe, expect, it } from 'vitest'
import diagramReducer, {
  createDiagram,
  addNode,
  addEdge,
  deleteNode,
  selectItems,
} from './diagramSlice'

describe('diagramSlice reducers', () => {
  it('creates a new diagram shell with cleared selection', () => {
    const state = diagramReducer(undefined, createDiagram({ name: 'Primer', type: 'HYBRID' }))

    expect(state.currentDiagram).not.toBeNull()
    expect(state?.currentDiagram?.nodes).toHaveLength(0)
    expect(state?.currentDiagram?.edges).toHaveLength(0)
    expect(state?.currentDiagram?.name).toBe('Primer')
    expect(state?.currentDiagram?.metadata.created).toMatch(/T/)
    const createdAt = state?.currentDiagram?.metadata.created as string
    const modifiedAt = state?.currentDiagram?.metadata.modified as string

    expect(createdAt).toMatch(/T/)
    expect(modifiedAt).toMatch(/T/)
    expect(Date.parse(modifiedAt)).toBeGreaterThanOrEqual(Date.parse(createdAt))
    expect(state.selectedItems).toEqual([])
  })

  it('adds a vocabulary node and stamps metadata', () => {
    let state = diagramReducer(undefined, createDiagram({ name: 'Builder', type: 'MUD' }))

    state = diagramReducer(
      state,
      addNode({
        type: 'vocabulary',
        label: 'Concept',
        position: { x: 10, y: 20 },
      }),
    )

    const node = state.currentDiagram?.nodes.at(0)

    expect(state.currentDiagram?.nodes).toHaveLength(1)
    expect(node).toMatchObject({
      type: 'vocabulary',
      label: 'Concept',
      position: { x: 10, y: 20 },
    })
    expect(typeof node?.id).toBe('string')
    expect(node?.id).toBeTruthy()
    expect(state.currentDiagram?.metadata.modified).toMatch(/T/)
  })

  it('removes a node and any incident edges', () => {
    let state = diagramReducer(undefined, createDiagram({ name: 'Prune', type: 'TOTE' }))

    state = diagramReducer(
      state,
      addNode({ type: 'vocabulary', label: 'Source', position: { x: 0, y: 0 } }),
    )
    const sourceId = state.currentDiagram?.nodes[0]?.id as string

    state = diagramReducer(
      state,
      addNode({ type: 'practice', label: 'Target', position: { x: 50, y: 0 } }),
    )
    const targetId = state.currentDiagram?.nodes[1]?.id as string

    state = diagramReducer(
      state,
      addEdge({ source: sourceId, target: targetId, type: 'PV' }),
    )
    const edgeId = state.currentDiagram?.edges[0]?.id as string

    state = diagramReducer(state, selectItems([sourceId, edgeId]))

    state = diagramReducer(state, deleteNode(sourceId))

    expect(state.currentDiagram?.nodes.map((node) => node.id)).not.toContain(sourceId)
    expect(state.currentDiagram?.edges).toHaveLength(0)
    expect(state.selectedItems).not.toContain(sourceId)
  })
})
