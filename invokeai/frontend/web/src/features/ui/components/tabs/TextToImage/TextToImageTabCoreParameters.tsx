import { Box, Flex } from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import IAICollapse from 'common/components/IAICollapse';
import ParamCFGScale from 'features/parameters/components/Parameters/Core/ParamCFGScale';
import ParamIterations from 'features/parameters/components/Parameters/Core/ParamIterations';
import ParamModelandVAEandScheduler from 'features/parameters/components/Parameters/Core/ParamModelandVAEandScheduler';
import ParamSize from 'features/parameters/components/Parameters/Core/ParamSize';
import ParamSteps from 'features/parameters/components/Parameters/Core/ParamSteps';
import ParamSeedFull from 'features/parameters/components/Parameters/Seed/ParamSeedFull';
import { memo } from 'react';

const selector = createSelector(
  stateSelector,
  ({ ui, generation }) => {
    const { shouldUseSliders } = ui;
    const { shouldRandomizeSeed } = generation;

    const activeLabel = !shouldRandomizeSeed ? 'Manual Seed' : undefined;

    return { shouldUseSliders, activeLabel };
  },
  defaultSelectorOptions
);

const TextToImageTabCoreParameters = () => {
  const { shouldUseSliders, activeLabel } = useAppSelector(selector);

  return (
    <IAICollapse label="General" activeLabel={activeLabel} defaultIsOpen={true}>
      <Flex
        sx={{
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {shouldUseSliders ? (
          <>
            <ParamIterations />
            <ParamSteps />
            <ParamCFGScale />
            <ParamModelandVAEandScheduler />
            <Box pt={2}>
              <ParamSeedFull />
            </Box>
            <ParamSize />
          </>
        ) : (
          <>
            <Flex gap={3}>
              <ParamIterations />
              <ParamSteps />
              <ParamCFGScale />
            </Flex>
            <ParamModelandVAEandScheduler />
            <Box pt={2}>
              <ParamSeedFull />
            </Box>
            <ParamSize />
          </>
        )}
      </Flex>
    </IAICollapse>
  );
};

export default memo(TextToImageTabCoreParameters);
