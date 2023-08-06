import { Flex } from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import IAIIconButton from 'common/components/IAIIconButton';
import IAIPopover from 'common/components/IAIPopover';
import IAISwitch from 'common/components/IAISwitch';
import { fieldBooleanValueChanged } from 'features/nodes/store/nodesSlice';
import { InvocationValue } from 'features/nodes/types/types';
import { memo, useCallback, useMemo } from 'react';
import { FaBars } from 'react-icons/fa';

interface IAINodeSettingsProps {
  data: InvocationValue;
}

const IAINodeSettings = (props: IAINodeSettingsProps) => {
  const { data } = props;
  const dispatch = useAppDispatch();

  const is_intermediate = useMemo(
    () =>
      (data.inputs['is_intermediate']?.value as boolean | undefined) ?? false,
    [data.inputs]
  );

  const handleChangeIsIntermediate = useCallback(() => {
    dispatch(
      fieldBooleanValueChanged({
        nodeId: data.id,
        fieldName: 'is_intermediate',
        value: !is_intermediate,
      })
    );
  }, [data.id, dispatch, is_intermediate]);

  return (
    <IAIPopover
      triggerComponent={
        <IAIIconButton
          className="nopan"
          aria-label="Node Settings"
          variant="link"
          sx={{
            minW: 8,
            w: 8,
            h: 8,
            color: 'base.500',
            _dark: {
              color: 'base.500',
            },
            _hover: {
              color: 'base.700',
              _dark: {
                color: 'base.300',
              },
            },
          }}
          icon={<FaBars />}
        />
      }
    >
      <Flex>
        <IAISwitch
          label="Save Output"
          isChecked={!is_intermediate}
          onChange={handleChangeIsIntermediate}
        />
      </Flex>
    </IAIPopover>
  );
};

export default memo(IAINodeSettings);
