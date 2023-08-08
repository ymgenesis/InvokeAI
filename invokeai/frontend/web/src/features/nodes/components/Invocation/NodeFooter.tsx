import {
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Spacer,
} from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import { fieldBooleanValueChanged } from 'features/nodes/store/nodesSlice';
import { InvocationNodeData } from 'features/nodes/types/types';
import { ChangeEvent, memo, useCallback } from 'react';

type Props = {
  data: InvocationNodeData;
};

const NodeFooter = (props: Props) => {
  const { data } = props;
  const dispatch = useAppDispatch();

  const handleChangeIsIntermediate = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      dispatch(
        fieldBooleanValueChanged({
          nodeId: data.id,
          fieldName: 'is_intermediate',
          value: !e.target.checked,
        })
      );
    },
    [data.id, dispatch]
  );
  return (
    <Flex
      sx={{
        w: 'full',
        borderBottomRadius: 'base',
        bg: 'base.200',
        _dark: { bg: 'base.750' },
        px: 2,
        py: 1,
      }}
    >
      <Spacer />
      <FormControl as={Flex} sx={{ alignItems: 'center', gap: 2, w: 'auto' }}>
        <FormLabel sx={{ fontSize: 'xs', mb: '1px' }}>Save Output</FormLabel>
        <Checkbox
          size="sm"
          onChange={handleChangeIsIntermediate}
          isChecked={!data.inputs['is_intermediate']?.value}
        />
      </FormControl>
    </Flex>
  );
};

export default memo(NodeFooter);
