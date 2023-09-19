import { Divider, Flex } from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import IAICollapse from 'common/components/IAICollapse';
import IAIIconButton from 'common/components/IAIIconButton';
import ControlNet from 'features/controlNet/components/ControlNet';
import IPAdapterPanel from 'features/controlNet/components/ipAdapter/IPAdapterPanel';
import ParamControlNetFeatureToggle from 'features/controlNet/components/parameters/ParamControlNetFeatureToggle';
import {
  controlNetAdded,
  controlNetModelChanged,
} from 'features/controlNet/store/controlNetSlice';
import { getValidControlNets } from 'features/controlNet/util/getValidControlNets';
import { useFeatureStatus } from 'features/system/hooks/useFeatureStatus';
import { map } from 'lodash-es';
import { Fragment, memo, useCallback } from 'react';
import { FaPlus } from 'react-icons/fa';
import {
  controlNetModelsAdapter,
  useGetControlNetModelsQuery,
} from 'services/api/endpoints/models';
import { v4 as uuidv4 } from 'uuid';

const selector = createSelector(
  [stateSelector],
  ({ controlNet }) => {
    const { controlNets, isEnabled, isIPAdapterEnabled } = controlNet;

    const validControlNets = getValidControlNets(controlNets);

    let activeLabel = undefined;

    if (isEnabled && validControlNets.length > 0) {
      activeLabel = `${validControlNets.length} ControlNet`;
    }

    if (isIPAdapterEnabled) {
      if (activeLabel) {
        activeLabel = `${activeLabel}, IP Adapter`;
      } else {
        activeLabel = 'IP Adapter';
      }
    }

    return { controlNetsArray: map(controlNets), activeLabel };
  },
  defaultSelectorOptions
);

const ParamControlNetCollapse = () => {
  const { controlNetsArray, activeLabel } = useAppSelector(selector);
  const isControlNetDisabled = useFeatureStatus('controlNet').isFeatureDisabled;
  const dispatch = useAppDispatch();
  const { firstModel } = useGetControlNetModelsQuery(undefined, {
    selectFromResult: (result) => {
      const firstModel = result.data
        ? controlNetModelsAdapter.getSelectors().selectAll(result.data)[0]
        : undefined;
      return {
        firstModel,
      };
    },
  });

  const handleClickedAddControlNet = useCallback(() => {
    if (!firstModel) {
      return;
    }
    const controlNetId = uuidv4();
    dispatch(controlNetAdded({ controlNetId }));
    dispatch(controlNetModelChanged({ controlNetId, model: firstModel }));
  }, [dispatch, firstModel]);

  if (isControlNetDisabled) {
    return null;
  }

  return (
    <IAICollapse label="Control Adapters" activeLabel={activeLabel}>
      <Flex sx={{ flexDir: 'column', gap: 2 }}>
        <Flex
          sx={{
            w: '100%',
            gap: 2,
            p: 2,
            ps: 3,
            borderRadius: 'base',
            alignItems: 'center',
            bg: 'base.250',
            _dark: {
              bg: 'base.750',
            },
          }}
        >
          <ParamControlNetFeatureToggle />
          <IAIIconButton
            tooltip="Add ControlNet"
            aria-label="Add ControlNet"
            icon={<FaPlus />}
            isDisabled={!firstModel}
            flexGrow={1}
            size="sm"
            onClick={handleClickedAddControlNet}
          />
        </Flex>
        {controlNetsArray.map((c, i) => (
          <Fragment key={c.controlNetId}>
            {i > 0 && <Divider />}
            <ControlNet controlNet={c} />
          </Fragment>
        ))}
        <IPAdapterPanel />
      </Flex>
    </IAICollapse>
  );
};

export default memo(ParamControlNetCollapse);
