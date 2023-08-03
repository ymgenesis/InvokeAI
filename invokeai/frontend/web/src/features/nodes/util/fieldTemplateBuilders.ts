import { logger } from 'app/logging/logger';
import { parseify } from 'common/util/serialize';
import { reduce } from 'lodash-es';
import { OpenAPIV3 } from 'openapi-types';
import { isSchemaObject } from '../types/typeGuards';
import {
  BooleanInputFieldTemplate,
  ClipInputFieldTemplate,
  CollectionInputFieldTemplate,
  CollectionItemInputFieldTemplate,
  ColorInputFieldTemplate,
  ConditioningInputFieldTemplate,
  ControlInputFieldTemplate,
  ControlNetModelInputFieldTemplate,
  EnumInputFieldTemplate,
  FieldType,
  FloatInputFieldTemplate,
  ImageCollectionInputFieldTemplate,
  ImageInputFieldTemplate,
  InputFieldTemplateBase,
  IntegerInputFieldTemplate,
  InvocationFieldSchema,
  LatentsInputFieldTemplate,
  LoRAModelInputFieldTemplate,
  ModelInputFieldTemplate,
  OutputFieldTemplate,
  RefinerModelInputFieldTemplate,
  StringInputFieldTemplate,
  UNetInputFieldTemplate,
  VaeInputFieldTemplate,
  VaeModelInputFieldTemplate,
  isFieldType,
  isInvocationFieldSchema,
} from '../types/types';

export type BaseFieldProperties = 'name' | 'title' | 'description';

export type BuildInputFieldArg = {
  schemaObject: InvocationFieldSchema;
  baseField: Omit<InputFieldTemplateBase, 'type'>;
};

/**
 * Transforms an invocation output ref object to field type.
 * @param ref The ref string to transform
 * @returns The field type.
 *
 * @example
 * refObjectToFieldType({ "$ref": "#/components/schemas/ImageField" }) --> 'ImageField'
 */
export const refObjectToFieldType = (
  refObject: OpenAPIV3.ReferenceObject
): FieldType => {
  const name = refObject.$ref.split('/').slice(-1)[0];
  if (!name) {
    throw `Unknown field type: ${name}`;
  }
  return name as FieldType;
};

const buildIntegerInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): IntegerInputFieldTemplate => {
  const template: IntegerInputFieldTemplate = {
    ...baseField,
    type: 'integer',
    default: schemaObject.default ?? 0,
  };

  if (schemaObject.multipleOf !== undefined) {
    template.multipleOf = schemaObject.multipleOf;
  }

  if (schemaObject.maximum !== undefined) {
    template.maximum = schemaObject.maximum;
  }

  if (schemaObject.exclusiveMaximum !== undefined) {
    template.exclusiveMaximum = schemaObject.exclusiveMaximum;
  }

  if (schemaObject.minimum !== undefined) {
    template.minimum = schemaObject.minimum;
  }

  if (schemaObject.exclusiveMinimum !== undefined) {
    template.exclusiveMinimum = schemaObject.exclusiveMinimum;
  }

  return template;
};

const buildFloatInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): FloatInputFieldTemplate => {
  const template: FloatInputFieldTemplate = {
    ...baseField,
    type: 'float',
    default: schemaObject.default ?? 0,
  };

  if (schemaObject.multipleOf !== undefined) {
    template.multipleOf = schemaObject.multipleOf;
  }

  if (schemaObject.maximum !== undefined) {
    template.maximum = schemaObject.maximum;
  }

  if (schemaObject.exclusiveMaximum !== undefined) {
    template.exclusiveMaximum = schemaObject.exclusiveMaximum;
  }

  if (schemaObject.minimum !== undefined) {
    template.minimum = schemaObject.minimum;
  }

  if (schemaObject.exclusiveMinimum !== undefined) {
    template.exclusiveMinimum = schemaObject.exclusiveMinimum;
  }

  return template;
};

const buildStringInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): StringInputFieldTemplate => {
  const template: StringInputFieldTemplate = {
    ...baseField,
    type: 'string',
    default: schemaObject.default ?? '',
  };

  if (schemaObject.minLength !== undefined) {
    template.minLength = schemaObject.minLength;
  }

  if (schemaObject.maxLength !== undefined) {
    template.maxLength = schemaObject.maxLength;
  }

  if (schemaObject.pattern !== undefined) {
    template.pattern = schemaObject.pattern;
  }

  return template;
};

const buildBooleanInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): BooleanInputFieldTemplate => {
  const template: BooleanInputFieldTemplate = {
    ...baseField,
    type: 'boolean',
    default: schemaObject.default ?? false,
  };

  return template;
};

const buildModelInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): ModelInputFieldTemplate => {
  const template: ModelInputFieldTemplate = {
    ...baseField,
    type: 'MainModelField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildRefinerModelInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): RefinerModelInputFieldTemplate => {
  const template: RefinerModelInputFieldTemplate = {
    ...baseField,
    type: 'SDXLRefinerModelField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildVaeModelInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): VaeModelInputFieldTemplate => {
  const template: VaeModelInputFieldTemplate = {
    ...baseField,
    type: 'VaeModelField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildLoRAModelInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): LoRAModelInputFieldTemplate => {
  const template: LoRAModelInputFieldTemplate = {
    ...baseField,
    type: 'LoRAModelField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildControlNetModelInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): ControlNetModelInputFieldTemplate => {
  const template: ControlNetModelInputFieldTemplate = {
    ...baseField,
    type: 'ControlNetModelField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildImageInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): ImageInputFieldTemplate => {
  const template: ImageInputFieldTemplate = {
    ...baseField,
    type: 'ImageField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildImageCollectionInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): ImageCollectionInputFieldTemplate => {
  const template: ImageCollectionInputFieldTemplate = {
    ...baseField,
    type: 'ImageCollection',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildLatentsInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): LatentsInputFieldTemplate => {
  const template: LatentsInputFieldTemplate = {
    ...baseField,
    type: 'LatentsField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildConditioningInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): ConditioningInputFieldTemplate => {
  const template: ConditioningInputFieldTemplate = {
    ...baseField,
    type: 'ConditioningField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildUNetInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): UNetInputFieldTemplate => {
  const template: UNetInputFieldTemplate = {
    ...baseField,
    type: 'UNetField',

    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildClipInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): ClipInputFieldTemplate => {
  const template: ClipInputFieldTemplate = {
    ...baseField,
    type: 'ClipField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildVaeInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): VaeInputFieldTemplate => {
  const template: VaeInputFieldTemplate = {
    ...baseField,
    type: 'VaeField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildControlInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): ControlInputFieldTemplate => {
  const template: ControlInputFieldTemplate = {
    ...baseField,
    type: 'ControlField',
    default: schemaObject.default ?? undefined,
  };

  return template;
};

const buildEnumInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): EnumInputFieldTemplate => {
  const options = schemaObject.enum ?? [];
  const template: EnumInputFieldTemplate = {
    ...baseField,
    type: 'enum',
    enumType: (schemaObject.type as 'string' | 'number') ?? 'string', // TODO: dangerous?
    options: options,
    default: schemaObject.default ?? options[0],
  };

  return template;
};

const buildCollectionInputFieldTemplate = ({
  baseField,
}: BuildInputFieldArg): CollectionInputFieldTemplate => {
  const template: CollectionInputFieldTemplate = {
    ...baseField,
    type: 'Collection',
    default: [],
  };

  return template;
};

const buildCollectionItemInputFieldTemplate = ({
  baseField,
}: BuildInputFieldArg): CollectionItemInputFieldTemplate => {
  const template: CollectionItemInputFieldTemplate = {
    ...baseField,
    type: 'CollectionItem',
    default: undefined,
  };

  return template;
};

const buildColorInputFieldTemplate = ({
  schemaObject,
  baseField,
}: BuildInputFieldArg): ColorInputFieldTemplate => {
  const template: ColorInputFieldTemplate = {
    ...baseField,
    type: 'ColorField',
    default: schemaObject.default ?? { r: 127, g: 127, b: 127, a: 255 },
  };

  return template;
};

export const getFieldType = (
  schemaObject: InvocationFieldSchema
): FieldType => {
  let fieldType: any = '';

  const { ui_type_hint } = schemaObject;
  if (ui_type_hint) {
    fieldType = ui_type_hint;
  } else if (!schemaObject.type) {
    // console.log('refObject', schemaObject);
    // if schemaObject has no type, then it should have one of allOf, anyOf, oneOf
    if (schemaObject.allOf) {
      fieldType = refObjectToFieldType(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        schemaObject.allOf![0] as OpenAPIV3.ReferenceObject
      );
    } else if (schemaObject.anyOf) {
      fieldType = refObjectToFieldType(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        schemaObject.anyOf![0] as OpenAPIV3.ReferenceObject
      );
    } else if (schemaObject.oneOf) {
      fieldType = refObjectToFieldType(
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        schemaObject.oneOf![0] as OpenAPIV3.ReferenceObject
      );
    }
  } else if (schemaObject.enum) {
    fieldType = 'enum';
  } else if (schemaObject.type) {
    if (schemaObject.type === 'number') {
      // floats are "number" in OpenAPI, while ints are "integer"
      fieldType = 'float';
    } else {
      fieldType = schemaObject.type;
    }
  }

  if (!isFieldType(fieldType)) {
    throw `Field type "${fieldType}" is unknown!`;
  }

  return fieldType;
};

/**
 * Builds an input field from an invocation schema property.
 * @param schemaObject The schema object
 * @returns An input field
 */
export const buildInputFieldTemplate = (
  schemaObject: InvocationFieldSchema,
  name: string
) => {
  // console.log('input', schemaObject);
  const fieldType = getFieldType(schemaObject);
  // console.log('input fieldType', fieldType);

  const {
    input_kind,
    input_requirement,
    ui_hidden,
    ui_component,
    ui_type_hint,
  } = schemaObject;

  const extra = {
    input_kind,
    input_requirement,
    ui_hidden,
    ui_component,
    ui_type_hint,
  };

  const baseField = {
    name,
    title: schemaObject.title ?? '',
    description: schemaObject.description ?? '',
    ...extra,
  };

  if (fieldType === 'ImageField') {
    return buildImageInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'ImageCollection') {
    return buildImageCollectionInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'LatentsField') {
    return buildLatentsInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'ConditioningField') {
    return buildConditioningInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'UNetField') {
    return buildUNetInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'ClipField') {
    return buildClipInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'VaeField') {
    return buildVaeInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'ControlField') {
    return buildControlInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'MainModelField') {
    return buildModelInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'SDXLRefinerModelField') {
    return buildRefinerModelInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'VaeModelField') {
    return buildVaeModelInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'LoRAModelField') {
    return buildLoRAModelInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'ControlNetModelField') {
    return buildControlNetModelInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'enum') {
    return buildEnumInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'integer') {
    return buildIntegerInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'float') {
    return buildFloatInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'string') {
    return buildStringInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'boolean') {
    return buildBooleanInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'Collection') {
    return buildCollectionInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'CollectionItem') {
    return buildCollectionItemInputFieldTemplate({ schemaObject, baseField });
  }
  if (fieldType === 'ColorField') {
    return buildColorInputFieldTemplate({ schemaObject, baseField });
  }
  return;
};

/**
 * Builds invocation output fields from an invocation's output reference object.
 * @param openAPI The OpenAPI schema
 * @param refObject The output reference object
 * @returns A record of outputs
 */
export const buildOutputFieldTemplates = (
  refObject: OpenAPIV3.ReferenceObject,
  openAPI: OpenAPIV3.Document
): Record<string, OutputFieldTemplate> => {
  // extract output schema name from ref
  const outputSchemaName = refObject.$ref.split('/').slice(-1)[0];

  if (!outputSchemaName) {
    logger('nodes').error(
      { refObject: parseify(refObject) },
      'No output schema name found in ref object'
    );
    throw 'No output schema name found in ref object';
  }

  // get the output schema itself
  const outputSchema = openAPI.components?.schemas?.[outputSchemaName];
  if (!outputSchema) {
    logger('nodes').error({ outputSchemaName }, 'Output schema not found');
    throw 'Output schema not found';
  }

  // console.log('output', outputSchema);
  if (isSchemaObject(outputSchema)) {
    // console.log('isSchemaObject');
    const outputFields = reduce(
      outputSchema.properties as OpenAPIV3.SchemaObject,
      (outputsAccumulator, property, propertyName) => {
        if (
          !['type', 'id'].includes(propertyName) &&
          !['object'].includes(property.type) && // TODO: handle objects?
          isInvocationFieldSchema(property)
        ) {
          const fieldType = getFieldType(property);
          // console.log('output fieldType', fieldType);
          outputsAccumulator[propertyName] = {
            name: propertyName,
            title: property.title ?? '',
            description: property.description ?? '',
            type: fieldType,
          };
        } else {
          // console.warn('Unhandled OUTPUT property', property);
        }

        return outputsAccumulator;
      },
      {} as Record<string, OutputFieldTemplate>
    );

    return outputFields;
  }

  return {};
};
