import { createSelector } from '@reduxjs/toolkit';
import { RootState } from 'app/store/store';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import { AnyInvocationType } from 'services/events/types';

export const makeTemplateSelector = (type: AnyInvocationType) =>
  createSelector(
    [(state: RootState) => state.nodes],
    (nodes) => {
      const template = nodes.invocationTemplates[type];
      if (!template) {
        return;
      }
      return template;
    },
    defaultSelectorOptions
  );
