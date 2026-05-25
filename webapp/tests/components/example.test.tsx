import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

describe('test framework', () => {
  it('should work', () => {
    render(<div>hello</div>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })
})
