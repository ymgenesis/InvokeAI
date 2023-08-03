import { isObject } from 'lodash-es';
import {
  CannyImageProcessorInvocation,
  ContentShuffleImageProcessorInvocation,
  HedImageProcessorInvocation,
  ImageField,
  LineartAnimeImageProcessorInvocation,
  LineartImageProcessorInvocation,
  MediapipeFaceProcessorInvocation,
  MidasDepthImageProcessorInvocation,
  MlsdImageProcessorInvocation,
  NormalbaeImageProcessorInvocation,
  OpenposeImageProcessorInvocation,
  PidiImageProcessorInvocation,
  ZoeDepthImageProcessorInvocation,
} from 'services/api/types';
import { O } from 'ts-toolbelt';

/**
 * Any ControlNet processor node
 */
export type ControlNetProcessorNode =
  | CannyImageProcessorInvocation
  | ContentShuffleImageProcessorInvocation
  | HedImageProcessorInvocation
  | LineartAnimeImageProcessorInvocation
  | LineartImageProcessorInvocation
  | MediapipeFaceProcessorInvocation
  | MidasDepthImageProcessorInvocation
  | MlsdImageProcessorInvocation
  | NormalbaeImageProcessorInvocation
  | OpenposeImageProcessorInvocation
  | PidiImageProcessorInvocation
  | ZoeDepthImageProcessorInvocation;

/**
 * Any ControlNet processor type
 */
export type ControlNetProcessorType = NonNullable<
  ControlNetProcessorNode['type'] | 'none'
>;

/**
 * The Canny processor node, with parameters flagged as required
 */
export type RequiredCannyImageProcessorInvocation = O.Optional<
  O.Required<
    CannyImageProcessorInvocation,
    'type' | 'low_threshold' | 'high_threshold'
  >,
  'image'
>;

/**
 * The ContentShuffle processor node, with parameters flagged as required
 */
export type RequiredContentShuffleImageProcessorInvocation = O.Optional<
  O.Required<
    ContentShuffleImageProcessorInvocation,
    'type' | 'detect_resolution' | 'image_resolution' | 'w' | 'h' | 'f'
  >,
  'image'
>;

/**
 * The HED processor node, with parameters flagged as required
 */
export type RequiredHedImageProcessorInvocation = O.Optional<
  O.Required<
    HedImageProcessorInvocation,
    'type' | 'detect_resolution' | 'image_resolution' | 'scribble'
  >,
  'image'
>;

/**
 * The Lineart Anime processor node, with parameters flagged as required
 */
export type RequiredLineartAnimeImageProcessorInvocation = O.Optional<
  O.Required<
    LineartAnimeImageProcessorInvocation,
    'type' | 'detect_resolution' | 'image_resolution'
  >,
  'image'
>;

/**
 * The Lineart processor node, with parameters flagged as required
 */
export type RequiredLineartImageProcessorInvocation = O.Optional<
  O.Required<
    LineartImageProcessorInvocation,
    'type' | 'detect_resolution' | 'image_resolution' | 'coarse'
  >,
  'image'
>;

/**
 * The MediapipeFace processor node, with parameters flagged as required
 */
export type RequiredMediapipeFaceProcessorInvocation = O.Optional<
  O.Required<
    MediapipeFaceProcessorInvocation,
    'type' | 'max_faces' | 'min_confidence'
  >,
  'image'
>;

/**
 * The MidasDepth processor node, with parameters flagged as required
 */
export type RequiredMidasDepthImageProcessorInvocation = O.Optional<
  O.Required<MidasDepthImageProcessorInvocation, 'type' | 'a_mult' | 'bg_th'>,
  'image'
>;

/**
 * The MLSD processor node, with parameters flagged as required
 */
export type RequiredMlsdImageProcessorInvocation = O.Optional<
  O.Required<
    MlsdImageProcessorInvocation,
    'type' | 'detect_resolution' | 'image_resolution' | 'thr_v' | 'thr_d'
  >,
  'image'
>;

/**
 * The NormalBae processor node, with parameters flagged as required
 */
export type RequiredNormalbaeImageProcessorInvocation = O.Optional<
  O.Required<
    NormalbaeImageProcessorInvocation,
    'type' | 'detect_resolution' | 'image_resolution'
  >,
  'image'
>;

/**
 * The Openpose processor node, with parameters flagged as required
 */
export type RequiredOpenposeImageProcessorInvocation = O.Optional<
  O.Required<
    OpenposeImageProcessorInvocation,
    'type' | 'detect_resolution' | 'image_resolution' | 'hand_and_face'
  >,
  'image'
>;

/**
 * The Pidi processor node, with parameters flagged as required
 */
export type RequiredPidiImageProcessorInvocation = O.Optional<
  O.Required<
    PidiImageProcessorInvocation,
    'type' | 'detect_resolution' | 'image_resolution' | 'safe' | 'scribble'
  >,
  'image'
>;

/**
 * The ZoeDepth processor node, with parameters flagged as required
 */
export type RequiredZoeDepthImageProcessorInvocation = O.Optional<
  O.Required<ZoeDepthImageProcessorInvocation, 'type'>,
  'image'
>;

/**
 * Any ControlNet Processor node, with its parameters flagged as required
 */
export type RequiredControlNetProcessorNode =
  | RequiredCannyImageProcessorInvocation
  | RequiredContentShuffleImageProcessorInvocation
  | RequiredHedImageProcessorInvocation
  | RequiredLineartAnimeImageProcessorInvocation
  | RequiredLineartImageProcessorInvocation
  | RequiredMediapipeFaceProcessorInvocation
  | RequiredMidasDepthImageProcessorInvocation
  | RequiredMlsdImageProcessorInvocation
  | RequiredNormalbaeImageProcessorInvocation
  | RequiredOpenposeImageProcessorInvocation
  | RequiredPidiImageProcessorInvocation
  | RequiredZoeDepthImageProcessorInvocation;

/**
 * Type guard for CannyImageProcessorInvocation
 */
export const isCannyImageProcessorInvocation = (
  obj: unknown
): obj is CannyImageProcessorInvocation => {
  if (isObject(obj) && 'type' in obj && obj.type === 'canny_image_processor') {
    return true;
  }
  return false;
};

/**
 * Type guard for ContentShuffleImageProcessorInvocation
 */
export const isContentShuffleImageProcessorInvocation = (
  obj: unknown
): obj is ContentShuffleImageProcessorInvocation => {
  if (
    isObject(obj) &&
    'type' in obj &&
    obj.type === 'content_shuffle_image_processor'
  ) {
    return true;
  }
  return false;
};

/**
 * Type guard for HedImageprocessorInvocation
 */
export const isHedImageprocessorInvocation = (
  obj: unknown
): obj is HedImageProcessorInvocation => {
  if (isObject(obj) && 'type' in obj && obj.type === 'hed_image_processor') {
    return true;
  }
  return false;
};

/**
 * Type guard for LineartAnimeImageProcessorInvocation
 */
export const isLineartAnimeImageProcessorInvocation = (
  obj: unknown
): obj is LineartAnimeImageProcessorInvocation => {
  if (
    isObject(obj) &&
    'type' in obj &&
    obj.type === 'lineart_anime_image_processor'
  ) {
    return true;
  }
  return false;
};

/**
 * Type guard for LineartImageProcessorInvocation
 */
export const isLineartImageProcessorInvocation = (
  obj: unknown
): obj is LineartImageProcessorInvocation => {
  if (
    isObject(obj) &&
    'type' in obj &&
    obj.type === 'lineart_image_processor'
  ) {
    return true;
  }
  return false;
};

/**
 * Type guard for MediapipeFaceProcessorInvocation
 */
export const isMediapipeFaceProcessorInvocation = (
  obj: unknown
): obj is MediapipeFaceProcessorInvocation => {
  if (
    isObject(obj) &&
    'type' in obj &&
    obj.type === 'mediapipe_face_processor'
  ) {
    return true;
  }
  return false;
};

/**
 * Type guard for MidasDepthImageProcessorInvocation
 */
export const isMidasDepthImageProcessorInvocation = (
  obj: unknown
): obj is MidasDepthImageProcessorInvocation => {
  if (
    isObject(obj) &&
    'type' in obj &&
    obj.type === 'midas_depth_image_processor'
  ) {
    return true;
  }
  return false;
};

/**
 * Type guard for MlsdImageProcessorInvocation
 */
export const isMlsdImageProcessorInvocation = (
  obj: unknown
): obj is MlsdImageProcessorInvocation => {
  if (isObject(obj) && 'type' in obj && obj.type === 'mlsd_image_processor') {
    return true;
  }
  return false;
};

/**
 * Type guard for NormalbaeImageProcessorInvocation
 */
export const isNormalbaeImageProcessorInvocation = (
  obj: unknown
): obj is NormalbaeImageProcessorInvocation => {
  if (
    isObject(obj) &&
    'type' in obj &&
    obj.type === 'normalbae_image_processor'
  ) {
    return true;
  }
  return false;
};

/**
 * Type guard for OpenposeImageProcessorInvocation
 */
export const isOpenposeImageProcessorInvocation = (
  obj: unknown
): obj is OpenposeImageProcessorInvocation => {
  if (
    isObject(obj) &&
    'type' in obj &&
    obj.type === 'openpose_image_processor'
  ) {
    return true;
  }
  return false;
};

/**
 * Type guard for PidiImageProcessorInvocation
 */
export const isPidiImageProcessorInvocation = (
  obj: unknown
): obj is PidiImageProcessorInvocation => {
  if (isObject(obj) && 'type' in obj && obj.type === 'pidi_image_processor') {
    return true;
  }
  return false;
};

/**
 * Type guard for ZoeDepthImageProcessorInvocation
 */
export const isZoeDepthImageProcessorInvocation = (
  obj: unknown
): obj is ZoeDepthImageProcessorInvocation => {
  if (
    isObject(obj) &&
    'type' in obj &&
    obj.type === 'zoe_depth_image_processor'
  ) {
    return true;
  }
  return false;
};
