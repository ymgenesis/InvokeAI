import { createSelector } from '@reduxjs/toolkit';
import { stateSelector } from 'app/store/store';
import { useAppSelector } from 'app/store/storeHooks';
import { defaultSelectorOptions } from 'app/store/util/defaultMemoizeOptions';
import { selectControlAdapterAll } from 'features/controlAdapters/store/controlAdaptersSlice';
import { isControlNetOrT2IAdapter } from 'features/controlAdapters/store/types';
import { isInvocationNode } from 'features/nodes/types/types';
import { activeTabNameSelector } from 'features/ui/store/uiSelectors';
import i18n from 'i18next';
import { forEach } from 'lodash-es';
import { getConnectedEdges } from 'reactflow';

const selector = createSelector(
  [stateSelector, activeTabNameSelector],
  (
    { controlAdapters, generation, system, nodes, dynamicPrompts },
    activeTabName
  ) => {
    const { initialImage, model } = generation;

    const { isConnected } = system;

    const reasons: string[] = [];

    // Cannot generate if not connected
    if (!isConnected) {
      reasons.push(i18n.t('parameters.invoke.systemDisconnected'));
    }

    if (activeTabName === 'img2img' && !initialImage) {
      reasons.push(i18n.t('parameters.invoke.noInitialImageSelected'));
    }

    if (activeTabName === 'nodes') {
      if (nodes.shouldValidateGraph) {
        if (!nodes.nodes.length) {
          reasons.push(i18n.t('parameters.invoke.noNodesInGraph'));
        }

        nodes.nodes.forEach((node) => {
          if (!isInvocationNode(node)) {
            return;
          }

          const nodeTemplate = nodes.nodeTemplates[node.data.type];

          if (!nodeTemplate) {
            // Node type not found
            reasons.push(i18n.t('parameters.invoke.missingNodeTemplate'));
            return;
          }

          const connectedEdges = getConnectedEdges([node], nodes.edges);

          forEach(node.data.inputs, (field) => {
            const fieldTemplate = nodeTemplate.inputs[field.name];
            const hasConnection = connectedEdges.some(
              (edge) =>
                edge.target === node.id && edge.targetHandle === field.name
            );

            if (!fieldTemplate) {
              reasons.push(i18n.t('parameters.invoke.missingFieldTemplate'));
              return;
            }

            if (
              fieldTemplate.required &&
              field.value === undefined &&
              !hasConnection
            ) {
              reasons.push(
                i18n.t('parameters.invoke.missingInputForField', {
                  nodeLabel: node.data.label || nodeTemplate.title,
                  fieldLabel: field.label || fieldTemplate.title,
                })
              );
              return;
            }
          });
        });
      }
    } else {
      if (dynamicPrompts.prompts.length === 0) {
        reasons.push(i18n.t('parameters.invoke.noPrompts'));
      }

      if (!model) {
        reasons.push(i18n.t('parameters.invoke.noModelSelected'));
      }

      selectControlAdapterAll(controlAdapters).forEach((ca, i) => {
        if (!ca.isEnabled) {
          return;
        }

        if (!ca.model) {
          reasons.push(
            i18n.t('parameters.invoke.noModelForControlAdapter', {
              number: i + 1,
            })
          );
        } else if (ca.model.base_model !== model?.base_model) {
          // This should never happen, just a sanity check
          reasons.push(
            i18n.t('parameters.invoke.incompatibleBaseModelForControlAdapter', {
              number: i + 1,
            })
          );
        }

        if (
          !ca.controlImage ||
          (isControlNetOrT2IAdapter(ca) &&
            !ca.processedControlImage &&
            ca.processorType !== 'none')
        ) {
          reasons.push(
            i18n.t('parameters.invoke.noControlImageForControlAdapter', {
              number: i + 1,
            })
          );
        }
      });
    }

    return { isReady: !reasons.length, reasons };
  },
  defaultSelectorOptions
);

export const useIsReadyToEnqueue = () => {
  const { isReady, reasons } = useAppSelector(selector);
  return { isReady, reasons };
};
