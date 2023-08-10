import { Flex, FormControl, FormLabel, Tooltip } from '@chakra-ui/react';
import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppDispatch, useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import { HANDLE_TOOLTIP_OPEN_DELAY } from 'features/nodes/types/constants';
import {
  InputFieldTemplate,
  InputFieldValue,
  isInvocationNode,
} from 'features/nodes/types/types';
import { forEach } from 'lodash-es';
import { memo } from 'react';
import InputFieldRenderer from '../../fields/InputFieldRenderer';

const selector = createSelector(
  stateSelector,
  ({ nodes }) => {
    const fields = nodes.nodes.filter(isInvocationNode).reduce((acc, node) => {
      const nodeTemplate = nodes.nodeTemplates[node.data.type];
      if (!nodeTemplate) {
        return acc;
      }

      forEach(node.data.inputs, (input) => {
        if (!input.isExposed) {
          return;
        }

        const fieldTemplate = nodeTemplate.inputs[input.name];
        if (!fieldTemplate) {
          return;
        }

        acc.push({ nodeId: node.id, field: input, fieldTemplate });
      });

      return acc;
    }, [] as { nodeId: string; field: InputFieldValue; fieldTemplate: InputFieldTemplate }[]);

    return {
      fields,
    };
  },
  defaultSelectorOptions
);

const WorkflowPanel = () => {
  const { fields } = useAppSelector(selector);

  return (
    <Flex
      sx={{
        flexDir: 'column',
        alignItems: 'flex-start',
        gap: 2,
        h: 'full',
      }}
    >
      {fields.map(({ field, fieldTemplate, nodeId }) => (
        <FormControl key={field.id}>
          <Tooltip
            label={fieldTemplate.description}
            openDelay={HANDLE_TOOLTIP_OPEN_DELAY}
            placement="top"
            shouldWrapChildren
            hasArrow
          >
            <FormLabel
              sx={{
                mb: 0,
              }}
            >
              {field.label || fieldTemplate.title}
            </FormLabel>
          </Tooltip>
          <InputFieldRenderer
            nodeId={nodeId}
            field={field}
            template={fieldTemplate}
          />
        </FormControl>
      ))}
    </Flex>
  );
};

export default memo(WorkflowPanel);
