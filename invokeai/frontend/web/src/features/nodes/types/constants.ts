import { FieldType, FieldUIConfig } from './types';

export const HANDLE_TOOLTIP_OPEN_DELAY = 500;
export const COLOR_TOKEN_VALUE = 500;
export const NODE_WIDTH = 320;
export const NODE_MIN_WIDTH = 320;

export const COLLECTION_TYPES: FieldType[] = [
  'Collection',
  'IntegerCollection',
  'FloatCollection',
  'StringCollection',
  'BooleanCollection',
  'ImageCollection',
];

const getColorTokenCssVariable = (color: string) =>
  `var(--invokeai-colors-${color}-${COLOR_TOKEN_VALUE})`;

export const FIELDS: Record<FieldType, FieldUIConfig> = {
  integer: {
    color: 'red',
    colorCssVar: getColorTokenCssVariable('red'),
    title: 'Integer',
    description: 'Integers are whole numbers, without a decimal point.',
  },
  float: {
    color: 'orange',
    colorCssVar: getColorTokenCssVariable('orange'),
    title: 'Float',
    description: 'Floats are numbers with a decimal point.',
  },
  string: {
    color: 'yellow',
    colorCssVar: getColorTokenCssVariable('yellow'),
    title: 'String',
    description: 'Strings are text.',
  },
  boolean: {
    color: 'green',
    colorCssVar: getColorTokenCssVariable('green'),
    title: 'Boolean',
    description: 'Booleans are true or false.',
  },
  enum: {
    color: 'blue',
    colorCssVar: getColorTokenCssVariable('blue'),
    title: 'Enum',
    description: 'Enums are values that may be one of a number of options.',
  },
  ImageField: {
    color: 'purple',
    colorCssVar: getColorTokenCssVariable('purple'),
    title: 'Image',
    description: 'Images may be passed between nodes.',
  },
  ImageCollection: {
    color: 'purple',
    colorCssVar: getColorTokenCssVariable('purple'),
    title: 'Image Collection',
    description: 'A collection of images.',
  },
  LatentsField: {
    color: 'pink',
    colorCssVar: getColorTokenCssVariable('pink'),
    title: 'Latents',
    description: 'Latents may be passed between nodes.',
  },
  ConditioningField: {
    color: 'cyan',
    colorCssVar: getColorTokenCssVariable('cyan'),
    title: 'Conditioning',
    description: 'Conditioning may be passed between nodes.',
  },
  UNetField: {
    color: 'red',
    colorCssVar: getColorTokenCssVariable('red'),
    title: 'UNet',
    description: 'UNet submodel.',
  },
  ClipField: {
    color: 'green',
    colorCssVar: getColorTokenCssVariable('green'),
    title: 'Clip',
    description: 'Tokenizer and text_encoder submodels.',
  },
  VaeField: {
    color: 'blue',
    colorCssVar: getColorTokenCssVariable('blue'),
    title: 'Vae',
    description: 'Vae submodel.',
  },
  ControlField: {
    color: 'cyan',
    colorCssVar: getColorTokenCssVariable('cyan'), // TODO: no free color left
    title: 'Control',
    description: 'Control info passed between nodes.',
  },
  MainModelField: {
    color: 'teal',
    colorCssVar: getColorTokenCssVariable('teal'),
    title: 'Model',
    description: 'TODO',
  },
  SDXLRefinerModelField: {
    color: 'teal',
    colorCssVar: getColorTokenCssVariable('teal'),
    title: 'Refiner Model',
    description: 'TODO',
  },
  VaeModelField: {
    color: 'teal',
    colorCssVar: getColorTokenCssVariable('teal'),
    title: 'VAE',
    description: 'TODO',
  },
  LoRAModelField: {
    color: 'teal',
    colorCssVar: getColorTokenCssVariable('teal'),
    title: 'LoRA',
    description: 'TODO',
  },
  ControlNetModelField: {
    color: 'teal',
    colorCssVar: getColorTokenCssVariable('teal'),
    title: 'ControlNet',
    description: 'TODO',
  },
  Collection: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'Collection',
    description: 'TODO',
  },
  CollectionItem: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'Collection Item',
    description: 'TODO',
  },
  ColorField: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'Color',
    description: 'A RGBA color.',
  },
  BooleanCollection: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'Boolean Collection',
    description: 'A collection of booleans.',
  },
  IntegerCollection: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'Integer Collection',
    description: 'A collection of integers.',
  },
  FloatCollection: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'Float Collection',
    description: 'A collection of floats.',
  },
  FilePath: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'File Path',
    description: 'A path to a file.',
  },
  LoRAField: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'LoRA',
    description: 'LoRA field.',
  },
  ONNXModelField: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'ONNX Model',
    description: 'ONNX model field.',
  },
  SDXLMainModelField: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'SDXL Model',
    description: 'SDXL model field.',
  },
  Seed: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'Seed',
    description: 'A seed for random number generation.',
  },
  StringCollection: {
    color: 'gray',
    colorCssVar: getColorTokenCssVariable('gray'),
    title: 'String Collection',
    description: 'A collection of strings.',
  },
};
