"use client";

import { create } from 'zustand';
import type { UseGdeltContextParams } from '@/hooks/useGdeltContext';
import type { UseGdeltCountryParams } from '@/hooks/useGdeltCountry';
import type { UseGdeltBilateralParams } from '@/hooks/useGdeltBilateral';
import type { UseGdeltBBVAParams } from '@/hooks/useGdeltBBVA';

export type GdeltMode = 'context' | 'country' | 'bilateral' | 'bbva';

export type GdeltModePayload = {
  context: UseGdeltContextParams;
  country: UseGdeltCountryParams;
  bilateral: UseGdeltBilateralParams;
  bbva: UseGdeltBBVAParams;
};

type PartialParams = Partial<GdeltModePayload[keyof GdeltModePayload]>;

type GdeltModeState = {
  mode: GdeltMode;
  params: PartialParams;
  setMode: <M extends GdeltMode>(mode: M, params?: Partial<GdeltModePayload[M]>) => void;
  reset: () => void;
};

const DEFAULT_STATE: Pick<GdeltModeState, 'mode' | 'params'> = {
  mode: 'context',
  params: {},
};

export const useGdeltMode = create<GdeltModeState>((set) => ({
  ...DEFAULT_STATE,
  setMode: (mode, params) =>
    set({
      mode,
      params: (params ?? {}) as PartialParams,
    }),
  reset: () => set(DEFAULT_STATE),
}));
