import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of, Subject } from 'rxjs';
import { PanelService } from './panel-service';

@Component({ template: '' })
class Editor {}

/** Lo que `PanelService` usa de `MatDialogRef`. */
class FakeRef {
  public readonly keydown = new Subject<KeyboardEvent>();
  public readonly closed = new Subject<unknown>();
  public readonly close = vi.fn((result?: unknown) => this.closed.next(result));

  public constructor(public readonly componentInstance: object) {}

  public keydownEvents() {
    return this.keydown;
  }

  public backdropClick() {
    return new Subject<MouseEvent>();
  }

  public afterClosed() {
    return this.closed;
  }
}

describe('PanelService', () => {
  let open: ReturnType<typeof vi.fn>;

  /** Abre un panel con `component`; el diálogo de confirmación responde `answer`. */
  function openPanel(component: object, answer?: boolean) {
    const panel = new FakeRef(component);
    open.mockReturnValueOnce(panel).mockReturnValueOnce({ afterClosed: () => of(answer) });
    void TestBed.inject(PanelService).open(Editor, null);

    return panel;
  }

  const pressEscape = async (panel: FakeRef) => {
    panel.keydown.next(new KeyboardEvent('keydown', { key: 'Escape' }));
    await new Promise((resolve) => setTimeout(resolve));
  };

  beforeEach(() => {
    open = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: MatDialog, useValue: { open } }] });
  });

  it('sin cambios, Escape cierra y entrega el resultado del panel', async () => {
    const panel = openPanel({ panelResult: () => true, hasUnsavedChanges: () => false });

    await pressEscape(panel);

    expect(panel.close).toHaveBeenCalledWith(true);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('con cambios, "Seguir editando" deja el panel abierto', async () => {
    const panel = openPanel({ hasUnsavedChanges: () => true }, undefined);

    await pressEscape(panel);

    expect(open).toHaveBeenCalledTimes(2);
    expect(panel.close).not.toHaveBeenCalled();
  });

  it('con cambios, "Descartar" cierra el panel', async () => {
    const panel = openPanel({ hasUnsavedChanges: () => true }, true);

    await pressEscape(panel);

    expect(panel.close).toHaveBeenCalledTimes(1);
  });
});
