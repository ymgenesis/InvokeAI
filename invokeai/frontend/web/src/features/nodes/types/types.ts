import {
  ControlNetModelParam,
  LoRAModelParam,
  MainModelParam,
  VaeModelParam,
} from 'features/parameters/types/parameterSchemas';
import { OpenAPIV3 } from 'openapi-types';
import { RgbaColor } from 'react-colorful';
import { Graph, ImageDTO, ImageField } from 'services/api/types';
import { AnyInvocationType } from 'services/events/types';
import { O } from 'ts-toolbelt';

export type NonNullableGraph = O.Required<Graph, 'nodes' | 'edges'>;

export type InvocationValue = {
  id: string;
  type: AnyInvocationType;
  inputs: Record<string, InputFieldValue>;
  outputs: Record<string, OutputFieldValue>;
};

export type InvocationTemplate = {
  /**
   * Unique type of the invocation
   */
  type: AnyInvocationType;
  /**
   * Display name of the invocation
   */
  title: string;
  /**
   * Description of the invocation
   */
  description: string;
  /**
   * Invocation tags
   */
  tags: string[];
  /**
   * Array of invocation inputs
   */
  inputs: Record<string, InputFieldTemplate>;
  /**
   * Array of the invocation outputs
   */
  outputs: Record<string, OutputFieldTemplate>;
};

export type FieldUIConfig = {
  color: string;
  colorCssVar: string;
  title: string;
  description: string;
};

/**
 * The valid invocation field types
 */
export type FieldType =
  | 'integer'
  | 'float'
  | 'string'
  | 'boolean'
  | 'enum'
  | 'image'
  | 'latents'
  | 'conditioning'
  | 'unet'
  | 'clip'
  | 'vae'
  | 'control'
  | 'model'
  | 'refiner_model'
  | 'vae_model'
  | 'lora_model'
  | 'controlnet_model'
  | 'array'
  | 'item'
  | 'color'
  | 'image_collection';

/**
 * An input field is persisted across reloads as part of the user's local state.
 *
 * An input field has three properties:
 * - `id` a unique identifier
 * - `name` the name of the field, which comes from the python dataclass
 * - `value` the field's value
 */
export type InputFieldValue =
  | IntegerInputFieldValue
  | FloatInputFieldValue
  | StringInputFieldValue
  | BooleanInputFieldValue
  | ImageInputFieldValue
  | LatentsInputFieldValue
  | ConditioningInputFieldValue
  | UNetInputFieldValue
  | ClipInputFieldValue
  | VaeInputFieldValue
  | ControlInputFieldValue
  | EnumInputFieldValue
  | MainModelInputFieldValue
  | RefinerModelInputFieldValue
  | VaeModelInputFieldValue
  | LoRAModelInputFieldValue
  | ControlNetModelInputFieldValue
  | ArrayInputFieldValue
  | ItemInputFieldValue
  | ColorInputFieldValue
  | ImageCollectionInputFieldValue;

/**
 * An input field template is generated on each page load from the OpenAPI schema.
 *
 * The template provides the field type and other field metadata (e.g. title, description,
 * maximum length, pattern to match, etc).
 */
export type InputFieldTemplate =
  | IntegerInputFieldTemplate
  | FloatInputFieldTemplate
  | StringInputFieldTemplate
  | BooleanInputFieldTemplate
  | ImageInputFieldTemplate
  | LatentsInputFieldTemplate
  | ConditioningInputFieldTemplate
  | UNetInputFieldTemplate
  | ClipInputFieldTemplate
  | VaeInputFieldTemplate
  | ControlInputFieldTemplate
  | EnumInputFieldTemplate
  | ModelInputFieldTemplate
  | RefinerModelInputFieldTemplate
  | VaeModelInputFieldTemplate
  | LoRAModelInputFieldTemplate
  | ControlNetModelInputFieldTemplate
  | ArrayInputFieldTemplate
  | ItemInputFieldTemplate
  | ColorInputFieldTemplate
  | ImageCollectionInputFieldTemplate;

/**
 * An output field is persisted across as part of the user's local state.
 *
 * An output field has two properties:
 * - `id` a unique identifier
 * - `name` the name of the field, which comes from the python dataclass
 */
export type OutputFieldValue = FieldValueBase;

/**
 * An output field template is generated on each page load from the OpenAPI schema.
 *
 * The template provides the output field's name, type, title, and description.
 */
export type OutputFieldTemplate = {
  name: string;
  type: FieldType;
  title: string;
  description: string;
};

/**
 * Indicates when/if this field needs an input.
 */
export type InputRequirement = 'always' | 'never' | 'optional';

/**
 * Indicates the kind of input(s) this field may have.
 */
export type InputKind = 'connection' | 'direct' | 'any';

export type FieldValueBase = {
  id: string;
  name: string;
  type: FieldType;
};

export type IntegerInputFieldValue = FieldValueBase & {
  type: 'integer';
  value?: number;
};

export type FloatInputFieldValue = FieldValueBase & {
  type: 'float';
  value?: number;
};

export type StringInputFieldValue = FieldValueBase & {
  type: 'string';
  value?: string;
};

export type BooleanInputFieldValue = FieldValueBase & {
  type: 'boolean';
  value?: boolean;
};

export type EnumInputFieldValue = FieldValueBase & {
  type: 'enum';
  value?: number | string;
};

export type LatentsInputFieldValue = FieldValueBase & {
  type: 'latents';
  value?: undefined;
};

export type ConditioningInputFieldValue = FieldValueBase & {
  type: 'conditioning';
  value?: string;
};

export type ControlInputFieldValue = FieldValueBase & {
  type: 'control';
  value?: undefined;
};

export type UNetInputFieldValue = FieldValueBase & {
  type: 'unet';
  value?: undefined;
};

export type ClipInputFieldValue = FieldValueBase & {
  type: 'clip';
  value?: undefined;
};

export type VaeInputFieldValue = FieldValueBase & {
  type: 'vae';
  value?: undefined;
};

export type ImageInputFieldValue = FieldValueBase & {
  type: 'image';
  value?: ImageField;
};

export type ImageCollectionInputFieldValue = FieldValueBase & {
  type: 'image_collection';
  value?: ImageField[];
};

export type MainModelInputFieldValue = FieldValueBase & {
  type: 'model';
  value?: MainModelParam;
};

export type RefinerModelInputFieldValue = FieldValueBase & {
  type: 'refiner_model';
  value?: MainModelParam;
};

export type VaeModelInputFieldValue = FieldValueBase & {
  type: 'vae_model';
  value?: VaeModelParam;
};

export type LoRAModelInputFieldValue = FieldValueBase & {
  type: 'lora_model';
  value?: LoRAModelParam;
};

export type ControlNetModelInputFieldValue = FieldValueBase & {
  type: 'controlnet_model';
  value?: ControlNetModelParam;
};

export type ArrayInputFieldValue = FieldValueBase & {
  type: 'array';
  value?: (string | number)[];
};

export type ItemInputFieldValue = FieldValueBase & {
  type: 'item';
  value?: undefined;
};

export type ColorInputFieldValue = FieldValueBase & {
  type: 'color';
  value?: RgbaColor;
};

export type InputFieldTemplateBase = {
  name: string;
  title: string;
  description: string;
  type: FieldType;
  inputRequirement: InputRequirement;
  inputKind: InputKind;
};

export type IntegerInputFieldTemplate = InputFieldTemplateBase & {
  type: 'integer';
  default: number;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
};

export type FloatInputFieldTemplate = InputFieldTemplateBase & {
  type: 'float';
  default: number;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: boolean;
  minimum?: number;
  exclusiveMinimum?: boolean;
};

export type StringInputFieldTemplate = InputFieldTemplateBase & {
  type: 'string';
  default: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
};

export type BooleanInputFieldTemplate = InputFieldTemplateBase & {
  default: boolean;
  type: 'boolean';
};

export type ImageInputFieldTemplate = InputFieldTemplateBase & {
  default: ImageDTO;
  type: 'image';
};

export type ImageCollectionInputFieldTemplate = InputFieldTemplateBase & {
  default: ImageField[];
  type: 'image_collection';
};

export type LatentsInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'latents';
};

export type ConditioningInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'conditioning';
};

export type UNetInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'unet';
};

export type ClipInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'clip';
};

export type VaeInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'vae';
};

export type ControlInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'control';
};

export type EnumInputFieldTemplate = InputFieldTemplateBase & {
  default: string | number;
  type: 'enum';
  enumType: 'string' | 'number';
  options: Array<string | number>;
};

export type ModelInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'model';
};

export type RefinerModelInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'refiner_model';
};

export type VaeModelInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'vae_model';
};

export type LoRAModelInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'lora_model';
};

export type ControlNetModelInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'controlnet_model';
};

export type ArrayInputFieldTemplate = InputFieldTemplateBase & {
  default: [];
  type: 'array';
};

export type ItemInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'item';
};

export type ColorInputFieldTemplate = InputFieldTemplateBase & {
  default: RgbaColor;
  type: 'color';
};

/**
 * JANKY CUSTOMISATION OF OpenAPI SCHEMA TYPES
 */

export type TypeHints = {
  [fieldName: string]: FieldType;
};

export type InvocationSchemaExtra = {
  output: OpenAPIV3.ReferenceObject; // the output of the invocation
  ui?: {
    tags?: string[];
    type_hints?: TypeHints;
    title?: string;
  };
  title: string;
  properties: Omit<
    NonNullable<OpenAPIV3.SchemaObject['properties']>,
    'type'
  > & {
    type: Omit<OpenAPIV3.SchemaObject, 'default'> & {
      default: AnyInvocationType;
    };
  };
};

export type InvocationSchemaType = {
  default: string; // the type of the invocation
};

export type InvocationBaseSchemaObject = Omit<
  OpenAPIV3.BaseSchemaObject,
  'title' | 'type' | 'properties'
> &
  InvocationSchemaExtra;

export interface ArraySchemaObject extends InvocationBaseSchemaObject {
  type: OpenAPIV3.ArraySchemaObjectType;
  items: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
}
export interface NonArraySchemaObject extends InvocationBaseSchemaObject {
  type?: OpenAPIV3.NonArraySchemaObjectType;
}

export type InvocationSchemaObject = ArraySchemaObject | NonArraySchemaObject;

export const isInvocationSchemaObject = (
  obj: OpenAPIV3.ReferenceObject | InvocationSchemaObject
): obj is InvocationSchemaObject => !('$ref' in obj);
