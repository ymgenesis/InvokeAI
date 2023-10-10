import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useMemo } from 'react';
import { selectControlAdapterById } from '../store/controlAdaptersSlice';
import { useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import { isControlNetOrT2IAdapter } from '../store/types';

export const useControlAdapterProcessedControlImage = (id: string) => {
  const selector = useMemo(
    () =>
      createSelector(
        stateSelector,
        ({ controlAdapters }) => {
          const ca = selectControlAdapterById(controlAdapters, id);

          return ca && isControlNetOrT2IAdapter(ca)
            ? ca.processedControlImage
            : undefined;
        },
        defaultSelectorOptions
      ),
    [id]
  );

  const weight = useAppSelector(selector);

  return weight;
};
