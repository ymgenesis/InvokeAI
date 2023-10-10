import { RootState } from 'app/store/store';
import { selectValidT2IAdapters } from 'features/controlAdapters/store/controlAdaptersSlice';
import { omit } from 'lodash-es';
import {
  CollectInvocation,
  MetadataAccumulatorInvocation,
  T2IAdapterInvocation,
} from 'services/api/types';
import { NonNullableGraph, T2IAdapterField } from '../../types/types';
import {
  CANVAS_COHERENCE_DENOISE_LATENTS,
  METADATA_ACCUMULATOR,
  T2I_ADAPTER_COLLECT,
} from './constants';

export const addT2IAdaptersToLinearGraph = (
  state: RootState,
  graph: NonNullableGraph,
  baseNodeId: string
): void => {
  const validT2IAdapters = selectValidT2IAdapters(state.controlAdapters).filter(
    (ca) => ca.model?.base_model === state.generation.model?.base_model
  );

  const metadataAccumulator = graph.nodes[METADATA_ACCUMULATOR] as
    | MetadataAccumulatorInvocation
    | undefined;

  if (validT2IAdapters.length) {
    // Even though denoise_latents' control input is polymorphic, keep it simple and always use a collect
    const t2iAdapterCollectNode: CollectInvocation = {
      id: T2I_ADAPTER_COLLECT,
      type: 'collect',
      is_intermediate: true,
    };
    graph.nodes[T2I_ADAPTER_COLLECT] = t2iAdapterCollectNode;
    graph.edges.push({
      source: { node_id: T2I_ADAPTER_COLLECT, field: 'collection' },
      destination: {
        node_id: baseNodeId,
        field: 't2i_adapter',
      },
    });

    validT2IAdapters.forEach((t2iAdapter) => {
      if (!t2iAdapter.model) {
        return;
      }
      const {
        id,
        controlImage,
        processedControlImage,
        beginStepPct,
        endStepPct,
        resizeMode,
        model,
        processorType,
        weight,
      } = t2iAdapter;

      const t2iAdapterNode: T2IAdapterInvocation = {
        id: `t2i_adapter_${id}`,
        type: 't2i_adapter',
        is_intermediate: true,
        begin_step_percent: beginStepPct,
        end_step_percent: endStepPct,
        resize_mode: resizeMode,
        t2i_adapter_model: model,
        weight: weight,
      };

      if (processedControlImage && processorType !== 'none') {
        // We've already processed the image in the app, so we can just use the processed image
        t2iAdapterNode.image = {
          image_name: processedControlImage,
        };
      } else if (controlImage) {
        // The control image is preprocessed
        t2iAdapterNode.image = {
          image_name: controlImage,
        };
      } else {
        // Skip ControlNets without an unprocessed image - should never happen if everything is working correctly
        return;
      }

      graph.nodes[t2iAdapterNode.id] = t2iAdapterNode as T2IAdapterInvocation;

      if (metadataAccumulator?.ipAdapters) {
        // metadata accumulator only needs a control field - not the whole node
        // extract what we need and add to the accumulator
        const t2iAdapterField = omit(t2iAdapterNode, [
          'id',
          'type',
        ]) as T2IAdapterField;
        metadataAccumulator.t2iAdapters.push(t2iAdapterField);
      }

      graph.edges.push({
        source: { node_id: t2iAdapterNode.id, field: 't2i_adapter' },
        destination: {
          node_id: T2I_ADAPTER_COLLECT,
          field: 'item',
        },
      });

      if (CANVAS_COHERENCE_DENOISE_LATENTS in graph.nodes) {
        graph.edges.push({
          source: { node_id: t2iAdapterNode.id, field: 't2i_adapter' },
          destination: {
            node_id: CANVAS_COHERENCE_DENOISE_LATENTS,
            field: 't2i_adapter',
          },
        });
      }
    });
  }
};
