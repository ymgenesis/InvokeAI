import {
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Spacer,
} from '@chakra-ui/react';
import { useAppDispatch } from 'app/store/storeHooks';
import { DRAG_HANDLE_CLASSNAME } from 'features/nodes/hooks/useBuildInvocation';
import { fieldBooleanValueChanged } from 'features/nodes/store/nodesSlice';
import {
  InvocationNodeData,
  InvocationTemplate,
} from 'features/nodes/types/types';
import { some } from 'lodash-es';
import { ChangeEvent, memo, useCallback, useMemo } from 'react';

type Props = {
  data: InvocationNodeData;
  template: InvocationTemplate;
};

const NodeFooter = (props: Props) => {
  const { data, template } = props;
  const dispatch = useAppDispatch();

  const hasImageOutput = useMemo(
    () =>
      some(template.outputs, (output) =>
        ['ImageField', 'ImageCollection'].includes(output.type)
      ),
    [template.outputs]
  );

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
      className={DRAG_HANDLE_CLASSNAME}
      layerStyle="nodeFooter"
      sx={{
        w: 'full',
        borderBottomRadius: 'base',
        px: 2,
        py: 0,
        h: 6,
      }}
    >
      <Spacer />
      {hasImageOutput && (
        <FormControl as={Flex} sx={{ alignItems: 'center', gap: 2, w: 'auto' }}>
          <FormLabel sx={{ fontSize: 'xs', mb: '1px' }}>Save Output</FormLabel>
          <Checkbox
            className="nopan"
            size="sm"
            onChange={handleChangeIsIntermediate}
            isChecked={!data.inputs['is_intermediate']?.value}
          />
        </FormControl>
      )}
    </Flex>
  );
};

export default memo(NodeFooter);
