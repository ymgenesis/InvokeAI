import { createSelector } from '@reduxjs/toolkit';
import { useAppSelector, useAppDispatch } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import { memo, useCallback } from 'react';
import { stateSelector } from 'app/store/store';
import { setHrfStrength } from 'features/parameters/store/generationSlice';
import IAISlider from 'common/components/IAISlider';

const selector = createSelector(
  [stateSelector],
  ({ generation, hotkeys, config }) => {
    const { initial, min, sliderMax, inputMax, fineStep, coarseStep } =
      config.sd.hrfStrength;
    const { hrfStrength, hrfEnabled } = generation;
    const step = hotkeys.shift ? fineStep : coarseStep;

    return {
      hrfStrength,
      initial,
      min,
      sliderMax,
      inputMax,
      step,
      hrfEnabled,
    };
  },
  defaultSelectorOptions
);

const ParamHrfStrength = () => {
  const { hrfStrength, initial, min, sliderMax, step, hrfEnabled } =
    useAppSelector(selector);
  const dispatch = useAppDispatch();

  const handleHrfStrengthReset = useCallback(() => {
    dispatch(setHrfStrength(initial));
  }, [dispatch, initial]);

  const handleHrfStrengthChange = useCallback(
    (v: number) => {
      dispatch(setHrfStrength(v));
    },
    [dispatch]
  );

  return (
    <IAISlider
      label="Denoising Strength"
      aria-label="High Resolution Denoising Strength"
      min={min}
      max={sliderMax}
      step={step}
      value={hrfStrength}
      onChange={handleHrfStrengthChange}
      withSliderMarks
      withInput
      withReset
      handleReset={handleHrfStrengthReset}
      isDisabled={!hrfEnabled}
    />
  );
};

export default memo(ParamHrfStrength);
