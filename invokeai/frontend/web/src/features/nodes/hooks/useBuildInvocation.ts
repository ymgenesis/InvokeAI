import { createSelector } from '@reduxjs/toolkit';
import { RootState } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { reduce } from 'lodash-es';
import { useCallback } from 'react';
import { Node, useReactFlow } from 'reactflow';
import { AnyInvocationType } from 'services/events/types';
import { v4 as uuidv4 } from 'uuid';
import {
  CurrentImageNodeData,
  InputFieldValue,
  InvocationNodeData,
  NotesNodeData,
  OutputFieldValue,
} from '../types/types';
import { buildInputFieldValue } from '../util/fieldValueBuilders';

const templatesSelector = createSelector(
  [(state: RootState) => state.nodes],
  (nodes) => nodes.nodeTemplates
);

export const DRAG_HANDLE_CLASSNAME = 'node-drag-handle';

export const SHARED_NODE_PROPERTIES: Partial<Node> = {
  dragHandle: `.${DRAG_HANDLE_CLASSNAME}`,
};

export const useBuildInvocation = () => {
  const invocationTemplates = useAppSelector(templatesSelector);

  const flow = useReactFlow();

  return useCallback(
    (type: AnyInvocationType | 'current_image' | 'notes') => {
      const nodeId = uuidv4();

      const { x, y } = flow.project({
        x: window.innerWidth / 2.5,
        y: window.innerHeight / 8,
      });
      if (type === 'current_image') {
        const node: Node<CurrentImageNodeData> = {
          ...SHARED_NODE_PROPERTIES,
          id: nodeId,
          type: 'current_image',
          position: { x: x, y: y },
          data: { id: nodeId, type: 'current_image' },
        };

        return node;
      }

      if (type === 'notes') {
        const node: Node<NotesNodeData> = {
          ...SHARED_NODE_PROPERTIES,
          id: nodeId,
          type: 'notes',
          position: { x: x, y: y },
          data: {
            id: nodeId,
            isOpen: true,
            label: 'Notes',
            notes: '',
            type: 'notes',
          },
        };

        return node;
      }

      const template = invocationTemplates[type];

      if (template === undefined) {
        console.error(`Unable to find template ${type}.`);
        return;
      }

      const inputs = reduce(
        template.inputs,
        (inputsAccumulator, inputTemplate, inputName) => {
          const fieldId = uuidv4();

          const inputFieldValue: InputFieldValue = buildInputFieldValue(
            fieldId,
            inputTemplate
          );

          inputsAccumulator[inputName] = inputFieldValue;

          return inputsAccumulator;
        },
        {} as Record<string, InputFieldValue>
      );

      const outputs = reduce(
        template.outputs,
        (outputsAccumulator, outputTemplate, outputName) => {
          const fieldId = uuidv4();

          const outputFieldValue: OutputFieldValue = {
            id: fieldId,
            name: outputName,
            type: outputTemplate.type,
          };

          outputsAccumulator[outputName] = outputFieldValue;

          return outputsAccumulator;
        },
        {} as Record<string, OutputFieldValue>
      );

      const invocation: Node<InvocationNodeData> = {
        ...SHARED_NODE_PROPERTIES,
        id: nodeId,
        type: 'invocation',
        position: { x: x, y: y },
        data: {
          id: nodeId,
          type,
          inputs,
          outputs,
          isOpen: true,
          label: '',
          notes: '',
        },
      };

      return invocation;
    },
    [invocationTemplates, flow]
  );
};
