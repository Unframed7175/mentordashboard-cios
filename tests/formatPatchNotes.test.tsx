import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { formatPatchNotes } from '../utils/formatPatchNotes';

describe('formatPatchNotes', () => {
  it('rendert een ### kop als h4', () => {
    const { container } = render(<div>{formatPatchNotes('### Fixed')}</div>);
    expect(container.querySelector('h4')?.textContent).toBe('Fixed');
  });

  it('rendert - bullets als een lijst', () => {
    const { container } = render(<div>{formatPatchNotes('- Eerste punt\n- Tweede punt')}</div>);
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toBe('Eerste punt');
    expect(items[1].textContent).toBe('Tweede punt');
  });

  it('rendert **vet** binnen een regel als <strong>', () => {
    const { container } = render(
      <div>{formatPatchNotes('- **BJ1 PDF-import** werkt weer correct')}</div>
    );
    expect(container.querySelector('strong')?.textContent).toBe('BJ1 PDF-import');
  });

  it('rendert een losse regel zonder marker als paragraaf', () => {
    const { container } = render(<div>{formatPatchNotes('Gewone tekst zonder marker')}</div>);
    expect(container.querySelector('p')?.textContent).toBe('Gewone tekst zonder marker');
  });

  it('combineert kop, bullets en platte tekst in document-volgorde', () => {
    const { container } = render(
      <div>{formatPatchNotes('### Fixed\n- Punt een\n- Punt twee\n\n### Changed\n- Punt drie')}</div>
    );
    const headings = container.querySelectorAll('h4');
    const lists = container.querySelectorAll('ul');
    expect(headings.length).toBe(2);
    expect(lists.length).toBe(2);
    expect(lists[0].querySelectorAll('li').length).toBe(2);
    expect(lists[1].querySelectorAll('li').length).toBe(1);
  });
});
