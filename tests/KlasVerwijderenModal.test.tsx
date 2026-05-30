// tests/KlasVerwijderenModal.test.tsx — Phase 33 Plan 01
// TDD RED phase: tests for KlasVerwijderenModal component
// Tests cover: klasnaam+count weergave, checkbox disabled/enabled, onCancel, onConfirm

import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import KlasVerwijderenModal from '../src/components/KlasVerwijderenModal'

function makeProps(overrides: Record<string, unknown> = {}) {
  return { klasNaam: 'CSD2A', leerlingCount: 19, onConfirm: vi.fn(), onCancel: vi.fn(), ...overrides }
}

describe('KlasVerwijderenModal', () => {
  it('KLS-05: toont klasnaam en leerlingaantal in modal body', () => {
    render(<KlasVerwijderenModal {...makeProps()} />)
    expect(screen.getByText(/CSD2A/)).toBeTruthy()
    expect(screen.getByText(/19/)).toBeTruthy()
  })

  it('KLS-06: confirm-knop is disabled bij initiële render (checkbox niet aangevinkt)', () => {
    render(<KlasVerwijderenModal {...makeProps()} />)
    const btn = screen.getByRole('button', { name: /Verwijderen/i })
    expect((btn as HTMLButtonElement).disabled).toBe(true)
  })

  it('KLS-06: confirm-knop wordt enabled na aanvinken checkbox', () => {
    render(<KlasVerwijderenModal {...makeProps()} />)
    fireEvent.click(screen.getByRole('checkbox'))
    const btn = screen.getByRole('button', { name: /Verwijderen/i })
    expect((btn as HTMLButtonElement).disabled).toBe(false)
  })

  it('KLS-04: klikken op Annuleren roept onCancel aan', () => {
    const onCancel = vi.fn()
    render(<KlasVerwijderenModal {...makeProps({ onCancel })} />)
    fireEvent.click(screen.getByRole('button', { name: /Annuleren/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('KLS-04: aanvinken checkbox dan klikken Verwijderen roept onConfirm aan', () => {
    const onConfirm = vi.fn()
    render(<KlasVerwijderenModal {...makeProps({ onConfirm })} />)
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Verwijderen/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })
})
