import {
  ControlNetModelParam,
  LoRAModelParam,
  MainModelParam,
  VaeModelParam,
} from 'features/parameters/types/parameterSchemas';
import { OpenAPIV3 } from 'openapi-types';
import { RgbaColor } from 'react-colorful';
import {
  Graph,
  ImageDTO,
  ImageField,
  InputFieldExtra,
  OutputFieldExtra,
} from 'services/api/types';
import { AnyInvocationType } from 'services/events/types';
import { O } from 'ts-toolbelt';
import { z } from 'zod';

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

// TODO: Get this from the OpenAPI schema? may be tricky...
export const zFieldType = z.enum([
  'integer',
  'float',
  'boolean',
  'string',
  'enum',
  'ImageField',
  'LatentsField',
  'ConditioningField',
  'ControlField',
  'MainModelField',
  'SDXLMainModelField',
  'SDXLRefinerModelField',
  'ONNXModelField',
  'VaeModelField',
  'LoRAModelField',
  'ControlNetModelField',
  'UNetField',
  'VaeField',
  'LoRAField',
  'ClipField',
  'ColorField',
  'ImageCollection',
  'IntegerCollection',
  'FloatCollection',
  'StringCollection',
  'BooleanCollection',
  'Seed',
  'FilePath',
  'Collection',
  'CollectionItem',
]);

export type FieldType = z.infer<typeof zFieldType>;

export const isFieldType = (value: unknown): value is FieldType =>
  zFieldType.safeParse(value).success;

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
  | SDXLMainModelInputFieldValue
  | RefinerModelInputFieldValue
  | VaeModelInputFieldValue
  | LoRAModelInputFieldValue
  | ControlNetModelInputFieldValue
  | CollectionInputFieldValue
  | CollectionItemInputFieldValue
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
  | MainModelInputFieldTemplate
  | SDXLMainModelInputFieldTemplate
  | RefinerModelInputFieldTemplate
  | VaeModelInputFieldTemplate
  | LoRAModelInputFieldTemplate
  | ControlNetModelInputFieldTemplate
  | CollectionInputFieldTemplate
  | CollectionItemInputFieldTemplate
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
  type: 'LatentsField';
  value?: undefined;
};

export type ConditioningInputFieldValue = FieldValueBase & {
  type: 'ConditioningField';
  value?: string;
};

export type ControlInputFieldValue = FieldValueBase & {
  type: 'ControlField';
  value?: undefined;
};

export type UNetInputFieldValue = FieldValueBase & {
  type: 'UNetField';
  value?: undefined;
};

export type ClipInputFieldValue = FieldValueBase & {
  type: 'ClipField';
  value?: undefined;
};

export type VaeInputFieldValue = FieldValueBase & {
  type: 'VaeField';
  value?: undefined;
};

export type ImageInputFieldValue = FieldValueBase & {
  type: 'ImageField';
  value?: ImageField;
};

export type ImageCollectionInputFieldValue = FieldValueBase & {
  type: 'ImageCollection';
  value?: ImageField[];
};

export type MainModelInputFieldValue = FieldValueBase & {
  type: 'MainModelField';
  value?: MainModelParam;
};

export type SDXLMainModelInputFieldValue = FieldValueBase & {
  type: 'SDXLMainModelField';
  value?: MainModelParam;
};

export type RefinerModelInputFieldValue = FieldValueBase & {
  type: 'SDXLRefinerModelField';
  value?: MainModelParam;
};

export type VaeModelInputFieldValue = FieldValueBase & {
  type: 'VaeModelField';
  value?: VaeModelParam;
};

export type LoRAModelInputFieldValue = FieldValueBase & {
  type: 'LoRAModelField';
  value?: LoRAModelParam;
};

export type ControlNetModelInputFieldValue = FieldValueBase & {
  type: 'ControlNetModelField';
  value?: ControlNetModelParam;
};

export type CollectionInputFieldValue = FieldValueBase & {
  type: 'Collection';
  value?: (string | number)[];
};

export type CollectionItemInputFieldValue = FieldValueBase & {
  type: 'CollectionItem';
  value?: undefined;
};

export type ColorInputFieldValue = FieldValueBase & {
  type: 'ColorField';
  value?: RgbaColor;
};

export type InputFieldTemplateBase = {
  name: string;
  title: string;
  description: string;
  type: FieldType;
  required: boolean;
} & InputFieldExtra;

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
  type: 'ImageField';
};

export type ImageCollectionInputFieldTemplate = InputFieldTemplateBase & {
  default: ImageField[];
  type: 'ImageCollection';
};

export type LatentsInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'LatentsField';
};

export type ConditioningInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'ConditioningField';
};

export type UNetInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'UNetField';
};

export type ClipInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'ClipField';
};

export type VaeInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'VaeField';
};

export type ControlInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'ControlField';
};

export type EnumInputFieldTemplate = InputFieldTemplateBase & {
  default: string | number;
  type: 'enum';
  enumType: 'string' | 'number';
  options: Array<string | number>;
};

export type MainModelInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'MainModelField';
};

export type SDXLMainModelInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'SDXLMainModelField';
};

export type RefinerModelInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'SDXLRefinerModelField';
};

export type VaeModelInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'VaeModelField';
};

export type LoRAModelInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'LoRAModelField';
};

export type ControlNetModelInputFieldTemplate = InputFieldTemplateBase & {
  default: string;
  type: 'ControlNetModelField';
};

export type CollectionInputFieldTemplate = InputFieldTemplateBase & {
  default: [];
  type: 'Collection';
};

export type CollectionItemInputFieldTemplate = InputFieldTemplateBase & {
  default: undefined;
  type: 'CollectionItem';
};

export type ColorInputFieldTemplate = InputFieldTemplateBase & {
  default: RgbaColor;
  type: 'ColorField';
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
    title?: string;
  };
  title: string;
  properties: Omit<
    NonNullable<OpenAPIV3.SchemaObject['properties']> &
      (InputFieldExtra | OutputFieldExtra),
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

export type InvocationFieldSchema = OpenAPIV3.SchemaObject & InputFieldExtra;

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

export const isInvocationFieldSchema = (
  obj: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
): obj is InvocationFieldSchema => !('$ref' in obj);
