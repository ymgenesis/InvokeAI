import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import IAISlider from 'common/components/IAISlider';
import { setImg2imgStrength } from 'features/parameters/store/generationSlice';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SubParametersWrapper from '../SubParametersWrapper';
import IAIInformationalPopover from 'common/components/IAIInformationalPopover/IAIInformationalPopover';

const selector = createSelector(
  [stateSelector],
  ({ generation, hotkeys, config }) => {
    const { initial, min, sliderMax, inputMax, fineStep, coarseStep } =
      config.sd.img2imgStrength;
    const { img2imgStrength } = generation;

    const step = hotkeys.shift ? fineStep : coarseStep;

    return {
      img2imgStrength,
      initial,
      min,
      sliderMax,
      inputMax,
      step,
    };
  },
  defaultSelectorOptions
);

const ImageToImageStrength = () => {
  const { img2imgStrength, initial, min, sliderMax, inputMax, step } =
    useAppSelector(selector);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleChange = useCallback(
    (v: number) => dispatch(setImg2imgStrength(v)),
    [dispatch]
  );

  const handleReset = useCallback(() => {
    dispatch(setImg2imgStrength(initial));
  }, [dispatch, initial]);

  return (
    <IAIInformationalPopover feature="paramDenoisingStrength">
      <SubParametersWrapper>
        <IAISlider
          label={`${t('parameters.denoisingStrength')}`}
          step={step}
          min={min}
          max={sliderMax}
          onChange={handleChange}
          handleReset={handleReset}
          value={img2imgStrength}
          isInteger={false}
          withInput
          withSliderMarks
          withReset
          sliderNumberInputProps={{ max: inputMax }}
        />
      </SubParametersWrapper>
    </IAIInformationalPopover>
  );
};

export default memo(ImageToImageStrength);
