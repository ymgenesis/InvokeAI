import { logger } from 'app/logging/logger';
import { RootState } from 'app/store/store';
import { NonNullableGraph } from 'features/nodes/types/types';
import {
  ImageResizeInvocation,
  ImageToLatentsInvocation,
} from 'services/api/types';
import { addControlNetToLinearGraph } from './addControlNetToLinearGraph';
import { addIPAdapterToLinearGraph } from './addIPAdapterToLinearGraph';
import { addNSFWCheckerToGraph } from './addNSFWCheckerToGraph';
import { addSDXLLoRAsToGraph } from './addSDXLLoRAstoGraph';
import { addSDXLRefinerToGraph } from './addSDXLRefinerToGraph';
import { addSaveImageNode } from './addSaveImageNode';
import { addSeamlessToLinearGraph } from './addSeamlessToLinearGraph';
import { addVAEToGraph } from './addVAEToGraph';
import { addWatermarkerToGraph } from './addWatermarkerToGraph';
import {
  IMAGE_TO_LATENTS,
  LATENTS_TO_IMAGE,
  METADATA_ACCUMULATOR,
  NEGATIVE_CONDITIONING,
  NOISE,
  POSITIVE_CONDITIONING,
  RESIZE,
  SDXL_DENOISE_LATENTS,
  SDXL_IMAGE_TO_IMAGE_GRAPH,
  SDXL_MODEL_LOADER,
  SDXL_REFINER_SEAMLESS,
  SEAMLESS,
} from './constants';
import { buildSDXLStylePrompts } from './helpers/craftSDXLStylePrompt';

/**
 * Builds the Image to Image tab graph.
 */
export const buildLinearSDXLImageToImageGraph = (
  state: RootState
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
    initialImage,
    shouldFitToWidthHeight,
    width,
    height,
    shouldUseCpuNoise,
    vaePrecision,
    seamlessXAxis,
    seamlessYAxis,
  } = state.generation;

  const {
    positiveStylePrompt,
    negativeStylePrompt,
    shouldUseSDXLRefiner,
    refinerStart,
    sdxlImg2ImgDenoisingStrength: strength,
  } = state.sdxl;

  /**
   * The easiest way to build linear graphs is to do it in the node editor, then copy and paste the
   * full graph here as a template. Then use the parameters from app state and set friendlier node
   * ids.
   *
   * The only thing we need extra logic for is handling randomized seed, control net, and for img2img,
   * the `fit` param. These are added to the graph at the end.
   */

  if (!initialImage) {
    log.error('No initial image found in state');
    throw new Error('No initial image found in state');
  }

  if (!model) {
    log.error('No model found in state');
    throw new Error('No model found in state');
  }

  const fp32 = vaePrecision === 'fp32';
  const is_intermediate = true;

  // Model Loader ID
  let modelLoaderNodeId = SDXL_MODEL_LOADER;

  const use_cpu = shouldUseCpuNoise;

  // Construct Style Prompt
  const { joinedPositiveStylePrompt, joinedNegativeStylePrompt } =
    buildSDXLStylePrompts(state);

  // copy-pasted graph from node editor, filled in with state values & friendly node ids
  const graph: NonNullableGraph = {
    id: SDXL_IMAGE_TO_IMAGE_GRAPH,
    nodes: {
      [modelLoaderNodeId]: {
        type: 'sdxl_model_loader',
        id: modelLoaderNodeId,
        model,
        is_intermediate,
      },
      [POSITIVE_CONDITIONING]: {
        type: 'sdxl_compel_prompt',
        id: POSITIVE_CONDITIONING,
        prompt: positivePrompt,
        style: joinedPositiveStylePrompt,
        is_intermediate,
      },
      [NEGATIVE_CONDITIONING]: {
        type: 'sdxl_compel_prompt',
        id: NEGATIVE_CONDITIONING,
        prompt: negativePrompt,
        style: joinedNegativeStylePrompt,
        is_intermediate,
      },
      [NOISE]: {
        type: 'noise',
        id: NOISE,
        use_cpu,
        seed,
        is_intermediate,
      },
      [LATENTS_TO_IMAGE]: {
        type: 'l2i',
        id: LATENTS_TO_IMAGE,
        fp32,
        is_intermediate,
      },
      [SDXL_DENOISE_LATENTS]: {
        type: 'denoise_latents',
        id: SDXL_DENOISE_LATENTS,
        cfg_scale,
        scheduler,
        steps,
        denoising_start: shouldUseSDXLRefiner
          ? Math.min(refinerStart, 1 - strength)
          : 1 - strength,
        denoising_end: shouldUseSDXLRefiner ? refinerStart : 1,
        is_intermediate,
      },
      [IMAGE_TO_LATENTS]: {
        type: 'i2l',
        id: IMAGE_TO_LATENTS,
        // must be set manually later, bc `fit` parameter may require a resize node inserted
        // image: {
        //   image_name: initialImage.image_name,
        // },
        fp32,
        is_intermediate,
      },
    },
    edges: [
      // Connect Model Loader to UNet, CLIP & VAE
      {
        source: {
          node_id: modelLoaderNodeId,
          field: 'unet',
        },
        destination: {
          node_id: SDXL_DENOISE_LATENTS,
          field: 'unet',
        },
      },
      {
        source: {
          node_id: modelLoaderNodeId,
          field: 'clip',
        },
        destination: {
          node_id: POSITIVE_CONDITIONING,
          field: 'clip',
        },
      },
      {
        source: {
          node_id: modelLoaderNodeId,
          field: 'clip2',
        },
        destination: {
          node_id: POSITIVE_CONDITIONING,
          field: 'clip2',
        },
      },
      {
        source: {
          node_id: modelLoaderNodeId,
          field: 'clip',
        },
        destination: {
          node_id: NEGATIVE_CONDITIONING,
          field: 'clip',
        },
      },
      {
        source: {
          node_id: modelLoaderNodeId,
          field: 'clip2',
        },
        destination: {
          node_id: NEGATIVE_CONDITIONING,
          field: 'clip2',
        },
      },
      // Connect everything to Denoise Latents
      {
        source: {
          node_id: POSITIVE_CONDITIONING,
          field: 'conditioning',
        },
        destination: {
          node_id: SDXL_DENOISE_LATENTS,
          field: 'positive_conditioning',
        },
      },
      {
        source: {
          node_id: NEGATIVE_CONDITIONING,
          field: 'conditioning',
        },
        destination: {
          node_id: SDXL_DENOISE_LATENTS,
          field: 'negative_conditioning',
        },
      },
      {
        source: {
          node_id: NOISE,
          field: 'noise',
        },
        destination: {
          node_id: SDXL_DENOISE_LATENTS,
          field: 'noise',
        },
      },
      {
        source: {
          node_id: IMAGE_TO_LATENTS,
          field: 'latents',
        },
        destination: {
          node_id: SDXL_DENOISE_LATENTS,
          field: 'latents',
        },
      },
      // Decode Denoised Latents To Image
      {
        source: {
          node_id: SDXL_DENOISE_LATENTS,
          field: 'latents',
        },
        destination: {
          node_id: LATENTS_TO_IMAGE,
          field: 'latents',
        },
      },
    ],
  };

  // handle `fit`
  if (
    shouldFitToWidthHeight &&
    (initialImage.width !== width || initialImage.height !== height)
  ) {
    // The init image needs to be resized to the specified width and height before being passed to `IMAGE_TO_LATENTS`

    // Create a resize node, explicitly setting its image
    const resizeNode: ImageResizeInvocation = {
      id: RESIZE,
      type: 'img_resize',
      image: {
        image_name: initialImage.imageName,
      },
      is_intermediate: true,
      width,
      height,
    };

    graph.nodes[RESIZE] = resizeNode;

    // The `RESIZE` node then passes its image to `IMAGE_TO_LATENTS`
    graph.edges.push({
      source: { node_id: RESIZE, field: 'image' },
      destination: {
        node_id: IMAGE_TO_LATENTS,
        field: 'image',
      },
    });

    // The `RESIZE` node also passes its width and height to `NOISE`
    graph.edges.push({
      source: { node_id: RESIZE, field: 'width' },
      destination: {
        node_id: NOISE,
        field: 'width',
      },
    });

    graph.edges.push({
      source: { node_id: RESIZE, field: 'height' },
      destination: {
        node_id: NOISE,
        field: 'height',
      },
    });
  } else {
    // We are not resizing, so we need to set the image on the `IMAGE_TO_LATENTS` node explicitly
    (graph.nodes[IMAGE_TO_LATENTS] as ImageToLatentsInvocation).image = {
      image_name: initialImage.imageName,
    };

    // Pass the image's dimensions to the `NOISE` node
    graph.edges.push({
      source: { node_id: IMAGE_TO_LATENTS, field: 'width' },
      destination: {
        node_id: NOISE,
        field: 'width',
      },
    });
    graph.edges.push({
      source: { node_id: IMAGE_TO_LATENTS, field: 'height' },
      destination: {
        node_id: NOISE,
        field: 'height',
      },
    });
  }

  // add metadata accumulator, which is only mostly populated - some fields are added later
  graph.nodes[METADATA_ACCUMULATOR] = {
    id: METADATA_ACCUMULATOR,
    type: 'metadata_accumulator',
    generation_mode: 'sdxl_img2img',
    cfg_scale,
    height,
    width,
    positive_prompt: positivePrompt,
    negative_prompt: negativePrompt,
    model,
    seed,
    steps,
    rand_device: use_cpu ? 'cpu' : 'cuda',
    scheduler,
    vae: undefined,
    controlnets: [],
    loras: [],
    strength: strength,
    init_image: initialImage.imageName,
    positive_style_prompt: positiveStylePrompt,
    negative_style_prompt: negativeStylePrompt,
  };

  graph.edges.push({
    source: {
      node_id: METADATA_ACCUMULATOR,
      field: 'metadata',
    },
    destination: {
      node_id: LATENTS_TO_IMAGE,
      field: 'metadata',
    },
  });

  // Add Seamless To Graph
  if (seamlessXAxis || seamlessYAxis) {
    addSeamlessToLinearGraph(state, graph, modelLoaderNodeId);
    modelLoaderNodeId = SEAMLESS;
  }

  // Add Refiner if enabled
  if (shouldUseSDXLRefiner) {
    addSDXLRefinerToGraph(state, graph, SDXL_DENOISE_LATENTS);
    if (seamlessXAxis || seamlessYAxis) {
      modelLoaderNodeId = SDXL_REFINER_SEAMLESS;
    }
  }

  // optionally add custom VAE
  addVAEToGraph(state, graph, modelLoaderNodeId);

  // Add LoRA Support
  addSDXLLoRAsToGraph(state, graph, SDXL_DENOISE_LATENTS, modelLoaderNodeId);

  // add controlnet, mutating `graph`
  addControlNetToLinearGraph(state, graph, SDXL_DENOISE_LATENTS);

  // Add IP Adapter
  addIPAdapterToLinearGraph(state, graph, SDXL_DENOISE_LATENTS);

  // NSFW & watermark - must be last thing added to graph
  if (state.system.shouldUseNSFWChecker) {
    // must add before watermarker!
    addNSFWCheckerToGraph(state, graph);
  }

  if (state.system.shouldUseWatermarker) {
    // must add after nsfw checker!
    addWatermarkerToGraph(state, graph);
  }

  addSaveImageNode(state, graph);

  return graph;
};
