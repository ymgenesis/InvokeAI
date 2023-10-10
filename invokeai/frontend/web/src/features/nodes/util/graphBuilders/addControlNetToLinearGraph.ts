import { RootState } from 'app/store/store';
import { selectValidControlNets } from 'features/controlAdapters/store/controlAdaptersSlice';
import { omit } from 'lodash-es';
import {
  CollectInvocation,
  ControlField,
  ControlNetInvocation,
  MetadataAccumulatorInvocation,
} from 'services/api/types';
import { NonNullableGraph } from '../../types/types';
import {
  CANVAS_COHERENCE_DENOISE_LATENTS,
  CONTROL_NET_COLLECT,
  METADATA_ACCUMULATOR,
} from './constants';

export const addControlNetToLinearGraph = (
  state: RootState,
  graph: NonNullableGraph,
  baseNodeId: string
): void => {
  const validControlNets = selectValidControlNets(state.controlAdapters).filter(
    (ca) => ca.model?.base_model === state.generation.model?.base_model
  );

  const metadataAccumulator = graph.nodes[METADATA_ACCUMULATOR] as
    | MetadataAccumulatorInvocation
    | undefined;

  if (validControlNets.length) {
    // Even though denoise_latents' control input is polymorphic, keep it simple and always use a collect
    const controlNetIterateNode: CollectInvocation = {
      id: CONTROL_NET_COLLECT,
      type: 'collect',
      is_intermediate: true,
    };
    graph.nodes[CONTROL_NET_COLLECT] = controlNetIterateNode;
    graph.edges.push({
      source: { node_id: CONTROL_NET_COLLECT, field: 'collection' },
      destination: {
        node_id: baseNodeId,
        field: 'control',
      },
    });

    validControlNets.forEach((controlNet) => {
      if (!controlNet.model) {
        return;
      }
      const {
        id,
        controlImage,
        processedControlImage,
        beginStepPct,
        endStepPct,
        controlMode,
        resizeMode,
        model,
        processorType,
        weight,
      } = controlNet;

      const controlNetNode: ControlNetInvocation = {
        id: `control_net_${id}`,
        type: 'controlnet',
        is_intermediate: true,
        begin_step_percent: beginStepPct,
        end_step_percent: endStepPct,
        control_mode: controlMode,
        resize_mode: resizeMode,
        control_model: model,
        control_weight: weight,
      };

      if (processedControlImage && processorType !== 'none') {
        // We've already processed the image in the app, so we can just use the processed image
        controlNetNode.image = {
          image_name: processedControlImage,
        };
      } else if (controlImage) {
        // The control image is preprocessed
        controlNetNode.image = {
          image_name: controlImage,
        };
      } else {
        // Skip ControlNets without an unprocessed image - should never happen if everything is working correctly
        return;
      }

      graph.nodes[controlNetNode.id] = controlNetNode as ControlNetInvocation;

      if (metadataAccumulator?.controlnets) {
        // metadata accumulator only needs a control field - not the whole node
        // extract what we need and add to the accumulator
        const controlField = omit(controlNetNode, [
          'id',
          'type',
        ]) as ControlField;
        metadataAccumulator.controlnets.push(controlField);
      }

      graph.edges.push({
        source: { node_id: controlNetNode.id, field: 'control' },
        destination: {
          node_id: CONTROL_NET_COLLECT,
          field: 'item',
        },
      });

      if (CANVAS_COHERENCE_DENOISE_LATENTS in graph.nodes) {
        graph.edges.push({
          source: { node_id: controlNetNode.id, field: 'control' },
          destination: {
            node_id: CANVAS_COHERENCE_DENOISE_LATENTS,
            field: 'control',
          },
        });
      }
    });
  }
};
