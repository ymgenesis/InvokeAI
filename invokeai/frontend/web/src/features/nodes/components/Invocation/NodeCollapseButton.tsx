import { ChevronUpIcon } from '@chakra-ui/icons';
import { useAppDispatch } from 'app/store/storeHooks';
import IAIIconButton from 'common/components/IAIIconButton';
import {
  nodeIsOpenChanged,
  nodeSelected,
} from 'features/nodes/store/nodesSlice';
import { InvocationValue } from 'features/nodes/types/types';
import { memo, useCallback } from 'react';
import { useUpdateNodeInternals } from 'reactflow';

interface IAINodeCollapseButtonProps {
  data: InvocationValue;
}

const IAINodeCollapseButton = (props: IAINodeCollapseButtonProps) => {
  const { data } = props;
  const { isOpen } = data;
  const dispatch = useAppDispatch();
  const updateNodeInternals = useUpdateNodeInternals();

  const handleClick = useCallback(() => {
    dispatch(nodeIsOpenChanged({ nodeId: data.id, isOpen: !isOpen }));
    dispatch(nodeSelected(data.id));
    updateNodeInternals(data.id);
  }, [data.id, dispatch, isOpen, updateNodeInternals]);

  return (
    <IAIIconButton
      className="nopan"
      onClick={handleClick}
      aria-label="Minimize"
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
      variant="link"
      icon={
        <ChevronUpIcon
          sx={{
            transform: isOpen ? 'rotate(0deg)' : 'rotate(180deg)',
            transitionProperty: 'common',
            transitionDuration: 'normal',
          }}
        />
      }
    />
  );
};

export default memo(IAINodeCollapseButton);
