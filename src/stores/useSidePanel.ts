"use client";

import { create } from 'zustand';

export type SidePanelMode = 'event' | 'market';

export type SidePanelPayload = {
  id?: string;
  json?: unknown;
};

type SidePanelState = {
  open: boolean;
  mode: SidePanelMode;
  payload: SidePanelPayload | null;
  openPanel: (mode: SidePanelMode, payload?: SidePanelPayload) => void;
  close: () => void;
  setPayload: (payload: SidePanelPayload | null) => void;
};

const INITIAL_STATE: Pick<SidePanelState, 'open' | 'mode' | 'payload'> = {
  open: false,
  mode: 'event',
  payload: null,
};

export const useSidePanel = create<SidePanelState>((set) => ({
  ...INITIAL_STATE,
  openPanel: (mode, payload = {}) =>
    set({
      open: true,
      mode,
      payload,
    }),
  close: () => set(INITIAL_STATE),
  setPayload: (payload) =>
    set((state) => ({
      ...state,
      payload,
    })),
}));
