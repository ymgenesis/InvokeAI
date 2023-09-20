import { logger } from 'app/logging/logger';
import { RootState } from 'app/store/store';
import { NonNullableGraph } from 'features/nodes/types/types';
import { ImageDTO, ImageToLatentsInvocation } from 'services/api/types';
import { addControlNetToLinearGraph } from './addControlNetToLinearGraph';
import { addIPAdapterToLinearGraph } from './addIPAdapterToLinearGraph';
import { addLoRAsToGraph } from './addLoRAsToGraph';
import { addNSFWCheckerToGraph } from './addNSFWCheckerToGraph';
import { addSaveImageNode } from './addSaveImageNode';
import { addSeamlessToLinearGraph } from './addSeamlessToLinearGraph';
import { addVAEToGraph } from './addVAEToGraph';
import { addWatermarkerToGraph } from './addWatermarkerToGraph';
import {
  CANVAS_IMAGE_TO_IMAGE_GRAPH,
  CANVAS_OUTPUT,
  CLIP_SKIP,
  DENOISE_LATENTS,
  IMAGE_TO_LATENTS,
  IMG2IMG_RESIZE,
  LATENTS_TO_IMAGE,
  MAIN_MODEL_LOADER,
  METADATA_ACCUMULATOR,
  NEGATIVE_CONDITIONING,
  NOISE,
  POSITIVE_CONDITIONING,
  SEAMLESS,
} from './constants';

/**
 * Builds the Canvas tab's Image to Image graph.
 */
export const buildCanvasImageToImageGraph = (
  state: RootState,
  initialImage: ImageDTO
): NonNullableGraph => {
  const log = logger('nodes');
  const {
    positivePrompt,
    negativePrompt,
    model,
    cfgScale: cfg_scale,
    scheduler,
    seed,
    steps,
    img2imgStrength: strength,
    vaePrecision,
    clipSkip,
    shouldUseCpuNoise,
    seamlessXAxis,
    seamlessYAxis,
  } = state.generation;

  // The bounding box determines width and height, not the width and height params
  const { width, height } = state.canvas.boundingBoxDimensions;

  const { scaledBoundingBoxDimensions, boundingBoxScaleMethod } = state.canvas;

  const fp32 = vaePrecision === 'fp32';
  const is_intermediate = true;
  const isUsingScaledDimensions = ['auto', 'manual'].includes(
    boundingBoxScaleMethod
  );

  if (!model) {
    log.error('No model found in state');
    throw new Error('No model found in state');
  }

  let modelLoaderNodeId = MAIN_MODEL_LOADER;

  const use_cpu = shouldUseCpuNoise;

  /**
   * The easiest way to build linear graphs is to do it in the node editor, then copy and paste the
   * full graph here as a template. Then use the parameters from app state and set friendlier node
   * ids.
   *
   * The only thing we need extra logic for is handling randomized seed, control net, and for img2img,
   * the `fit` param. These are added to the graph at the end.
   */

  // copy-pasted graph from node editor, filled in with state values & friendly node ids
  const graph: NonNullableGraph = {
    id: CANVAS_IMAGE_TO_IMAGE_GRAPH,
    nodes: {
      [modelLoaderNodeId]: {
        type: 'main_model_loader',
        id: modelLoaderNodeId,
        is_intermediate,
        model,
      },
      [CLIP_SKIP]: {
        type: 'clip_skip',
        id: CLIP_SKIP,
        is_intermediate,
        skipped_layers: clipSkip,
      },
      [POSITIVE_CONDITIONING]: {
        type: 'compel',
        id: POSITIVE_CONDITIONING,
        is_intermediate,
        prompt: positivePrompt,
      },
      [NEGATIVE_CONDITIONING]: {
        type: 'compel',
        id: NEGATIVE_CONDITIONING,
        is_intermediate,
        prompt: negativePrompt,
      },
      [NOISE]: {
        type: 'noise',
        id: NOISE,
        is_intermediate,
        use_cpu,
        seed,
        width: !isUsingScaledDimensions
          ? width
          : scaledBoundingBoxDimensions.width,
        height: !isUsingScaledDimensions
          ? height
          : scaledBoundingBoxDimensions.height,
      },
      [IMAGE_TO_LATENTS]: {
        type: 'i2l',
        id: IMAGE_TO_LATENTS,
        is_intermediate,
      },
      [DENOISE_LATENTS]: {
        type: 'denoise_latents',
        id: DENOISE_LATENTS,
        is_intermediate,
        cfg_scale,
        scheduler,
        steps,
        denoising_start: 1 - strength,
        denoising_end: 1,
      },
      [CANVAS_OUTPUT]: {
        type: 'l2i',
        id: CANVAS_OUTPUT,
        is_intermediate,
      },
    },
    edges: [
      // Connect Model Loader to CLIP Skip and UNet
      {
        source: {
          node_id: modelLoaderNodeId,
          field: 'unet',
        },
        destination: {
          node_id: DENOISE_LATENTS,
          field: 'unet',
        },
      },
      {
        source: {
          node_id: modelLoaderNodeId,
          field: 'clip',
        },
        destination: {
          node_id: CLIP_SKIP,
          field: 'clip',
        },
      },
      // Connect CLIP Skip To Conditioning
      {
        source: {
          node_id: CLIP_SKIP,
          field: 'clip',
        },
        destination: {
          node_id: POSITIVE_CONDITIONING,
          field: 'clip',
        },
      },
      {
        source: {
          node_id: CLIP_SKIP,
          field: 'clip',
        },
        destination: {
          node_id: NEGATIVE_CONDITIONING,
          field: 'clip',
        },
      },
      // Connect Everything To Denoise Latents
      {
        source: {
          node_id: POSITIVE_CONDITIONING,
          field: 'conditioning',
        },
        destination: {
          node_id: DENOISE_LATENTS,
          field: 'positive_conditioning',
        },
      },
      {
        source: {
          node_id: NEGATIVE_CONDITIONING,
          field: 'conditioning',
        },
        destination: {
          node_id: DENOISE_LATENTS,
          field: 'negative_conditioning',
        },
      },
      {
        source: {
          node_id: NOISE,
          field: 'noise',
        },
        destination: {
          node_id: DENOISE_LATENTS,
          field: 'noise',
        },
      },
      {
        source: {
          node_id: IMAGE_TO_LATENTS,
          field: 'latents',
        },
        destination: {
          node_id: DENOISE_LATENTS,
          field: 'latents',
        },
      },
    ],
  };

  // Decode Latents To Image & Handle Scaled Before Processing
  if (isUsingScaledDimensions) {
    graph.nodes[IMG2IMG_RESIZE] = {
      id: IMG2IMG_RESIZE,
      type: 'img_resize',
      is_intermediate,
      image: initialImage,
      width: scaledBoundingBoxDimensions.width,
      height: scaledBoundingBoxDimensions.height,
    };
    graph.nodes[LATENTS_TO_IMAGE] = {
      id: LATENTS_TO_IMAGE,
      type: 'l2i',
      is_intermediate,
      fp32,
    };
    graph.nodes[CANVAS_OUTPUT] = {
      id: CANVAS_OUTPUT,
      type: 'img_resize',
      is_intermediate,
      width: width,
      height: height,
    };

    graph.edges.push(
      {
        source: {
          node_id: IMG2IMG_RESIZE,
          field: 'image',
        },
        destination: {
          node_id: IMAGE_TO_LATENTS,
          field: 'image',
        },
      },
      {
        source: {
          node_id: DENOISE_LATENTS,
          field: 'latents',
        },
        destination: {
          node_id: LATENTS_TO_IMAGE,
          field: 'latents',
        },
      },
      {
        source: {
          node_id: LATENTS_TO_IMAGE,
          field: 'image',
        },
        destination: {
          node_id: CANVAS_OUTPUT,
          field: 'image',
        },
      }
    );
  } else {
    graph.nodes[CANVAS_OUTPUT] = {
      type: 'l2i',
      id: CANVAS_OUTPUT,
      is_intermediate,
      fp32,
    };

    (graph.nodes[IMAGE_TO_LATENTS] as ImageToLatentsInvocation).image =
      initialImage;

    graph.edges.push({
      source: {
        node_id: DENOISE_LATENTS,
        field: 'latents',
      },
      destination: {
        node_id: CANVAS_OUTPUT,
        field: 'latents',
      },
    });
  }

  // add metadata accumulator, which is only mostly populated - some fields are added later
  graph.nodes[METADATA_ACCUMULATOR] = {
    id: METADATA_ACCUMULATOR,
    type: 'metadata_accumulator',
    generation_mode: 'img2img',
    cfg_scale,
    width: !isUsingScaledDimensions ? width : scaledBoundingBoxDimensions.width,
    height: !isUsingScaledDimensions
      ? height
      : scaledBoundingBoxDimensions.height,
    positive_prompt: positivePrompt,
    negative_prompt: negativePrompt,
    model,
    seed,
    steps,
    rand_device: use_cpu ? 'cpu' : 'cuda',
    scheduler,
    vae: undefined, // option; set in addVAEToGraph
    controlnets: [], // populated in addControlNetToLinearGraph
    loras: [], // populated in addLoRAsToGraph
    clip_skip: clipSkip,
    strength,
    init_image: initialImage.image_name,
  };

  // Add Seamless To Graph
  if (seamlessXAxis || seamlessYAxis) {
    addSeamlessToLinearGraph(state, graph, modelLoaderNodeId);
    modelLoaderNodeId = SEAMLESS;
  }

  // add LoRA support
  addLoRAsToGraph(state, graph, DENOISE_LATENTS);

  // optionally add custom VAE
  addVAEToGraph(state, graph, modelLoaderNodeId);

  // add controlnet, mutating `graph`
  addControlNetToLinearGraph(state, graph, DENOISE_LATENTS);

  // Add IP Adapter
  addIPAdapterToLinearGraph(state, graph, DENOISE_LATENTS);

  // NSFW & watermark - must be last thing added to graph
  if (state.system.shouldUseNSFWChecker) {
    // must add before watermarker!
    addNSFWCheckerToGraph(state, graph, CANVAS_OUTPUT);
  }

  if (state.system.shouldUseWatermarker) {
    // must add after nsfw checker!
    addWatermarkerToGraph(state, graph, CANVAS_OUTPUT);
  }

  addSaveImageNode(state, graph);

  return graph;
};
