import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import IAISwitch from 'common/components/IAISwitch';
import { memo, useCallback } from 'react';
import { combinatorialToggled } from '../store/dynamicPromptsSlice';
import { useTranslation } from 'react-i18next';
import IAIInformationalPopover from 'common/components/IAIInformationalPopover';

const selector = createSelector(
  stateSelector,
  (state) => {
    const { combinatorial } = state.dynamicPrompts;

    return { combinatorial };
  },
  defaultSelectorOptions
);

const ParamDynamicPromptsCombinatorial = () => {
  const { combinatorial } = useAppSelector(selector);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleChange = useCallback(() => {
    dispatch(combinatorialToggled());
  }, [dispatch]);

  return (
    <IAIInformationalPopover details="dynamicPromptsCombinatorial">
      <IAISwitch
        label={t('dynamicPrompts.combinatorial')}
        isChecked={combinatorial}
        onChange={handleChange}
      />
    </IAIInformationalPopover>
  );
};

export default memo(ParamDynamicPromptsCombinatorial);
