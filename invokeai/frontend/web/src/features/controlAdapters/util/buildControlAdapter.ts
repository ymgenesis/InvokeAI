import { cloneDeep, merge } from 'lodash-es';
import {
  ControlAdapterConfig,
  ControlAdapterType,
  ControlNetConfig,
  IPAdapterConfig,
  RequiredCannyImageProcessorInvocation,
  T2IAdapterConfig,
} from '../store/types';
import { CONTROLNET_PROCESSORS } from '../store/constants';

export const initialControlNet: Omit<ControlNetConfig, 'id'> = {
  type: 'controlnet',
  isEnabled: true,
  model: null,
  weight: 1,
  beginStepPct: 0,
  endStepPct: 1,
  controlMode: 'balanced',
  resizeMode: 'just_resize',
  controlImage: null,
  processedControlImage: null,
  processorType: 'canny_image_processor',
  processorNode: CONTROLNET_PROCESSORS.canny_image_processor
    .default as RequiredCannyImageProcessorInvocation,
  shouldAutoConfig: true,
};

export const initialT2IAdapter: Omit<T2IAdapterConfig, 'id'> = {
  type: 't2i_adapter',
  isEnabled: true,
  model: null,
  weight: 1,
  beginStepPct: 0,
  endStepPct: 1,
  resizeMode: 'just_resize',
  controlImage: null,
  processedControlImage: null,
  processorType: 'canny_image_processor',
  processorNode: CONTROLNET_PROCESSORS.canny_image_processor
    .default as RequiredCannyImageProcessorInvocation,
  shouldAutoConfig: true,
};

export const initialIPAdapter: Omit<IPAdapterConfig, 'id'> = {
  type: 'ip_adapter',
  isEnabled: true,
  controlImage: null,
  model: null,
  weight: 1,
  beginStepPct: 0,
  endStepPct: 1,
};

export const buildControlAdapter = (
  id: string,
  type: ControlAdapterType,
  overrides: Partial<ControlAdapterConfig> = {}
): ControlAdapterConfig => {
  switch (type) {
    case 'controlnet':
      return merge(cloneDeep(initialControlNet), { id, ...overrides });
    case 't2i_adapter':
      return merge(cloneDeep(initialT2IAdapter), { id, ...overrides });
    case 'ip_adapter':
      return merge(cloneDeep(initialIPAdapter), { id, ...overrides });
    default:
      throw new Error(`Unknown control adapter type: ${type}`);
  }
};
