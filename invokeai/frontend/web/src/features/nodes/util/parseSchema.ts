import { filter, reduce } from 'lodash-es';
import { OpenAPIV3 } from 'openapi-types';
import {
  InputFieldTemplate,
  InvocationSchemaObject,
  InvocationTemplate,
  OutputFieldTemplate,
  isInvocationFieldSchema,
  isInvocationSchemaObject,
} from '../types/types';
import {
  buildInputFieldTemplate,
  buildOutputFieldTemplates,
} from './fieldTemplateBuilders';

const RESERVED_FIELD_NAMES = ['id', 'type', 'metadata'];

const invocationDenylist = [
  'Graph',
  'InvocationMeta',
  'MetadataAccumulatorInvocation',
];

export const parseSchema = (
  openAPI: OpenAPIV3.Document
): Record<string, InvocationTemplate> => {
  const filteredSchemas = filter(
    openAPI.components?.schemas,
    (schema, key) =>
      key.includes('Invocation') &&
      !key.includes('InvocationOutput') &&
      !invocationDenylist.some((denylistItem) => key.includes(denylistItem))
  ) as (OpenAPIV3.ReferenceObject | InvocationSchemaObject)[];

  const invocations = filteredSchemas.reduce<
    Record<string, InvocationTemplate>
  >((acc, schema) => {
    if (isInvocationSchemaObject(schema)) {
      const type = schema.properties.type.default;
      const title = schema.ui?.title ?? schema.title.replace('Invocation', '');
      console.log(schema);
      const tags = schema.ui?.tags ?? [];

      const inputs: Record<string, InputFieldTemplate> = {};

      if (type === 'collect') {
        const itemProperty = schema.properties.item as InvocationSchemaObject;
        inputs.item = {
          type: 'CollectionItem',
          name: 'item',
          description: itemProperty.description ?? '',
          title: 'Collection Item',
          input_kind: 'connection',
          default: undefined,
          ui_hidden: false,
          required: true,
        };
      } else if (type === 'iterate') {
        const itemProperty = schema.properties
          .collection as InvocationSchemaObject;
        inputs.collection = {
          type: 'Collection',
          name: 'collection',
          title: itemProperty.title ?? '',
          default: [],
          description: itemProperty.description ?? '',
          input_kind: 'connection',
          ui_hidden: false,
          required: true,
        };
      } else {
        reduce(
          schema.properties,
          (inputsAccumulator, property, propertyName) => {
            if (
              !RESERVED_FIELD_NAMES.includes(propertyName) &&
              isInvocationFieldSchema(property)
            ) {
              const field = buildInputFieldTemplate(
                schema,
                property,
                propertyName
              );

              if (field) {
                inputsAccumulator[propertyName] = field;
              }
            } else {
              // console.warn('Unhandled INPUT property', property);
            }
            return inputsAccumulator;
          },
          inputs
        );
      }

      const rawOutput = (schema as InvocationSchemaObject).output;
      let outputs: Record<string, OutputFieldTemplate>;

      if (type === 'iterate') {
        // Special handling for iterate
        const iterationOutput = openAPI.components?.schemas?.[
          'IterateInvocationOutput'
        ] as OpenAPIV3.SchemaObject;
        outputs = {
          item: {
            name: 'item',
            title: iterationOutput?.title ?? '',
            description: iterationOutput?.description ?? '',
            type: 'CollectionItem',
          },
        };
      } else if (type === 'collect') {
        // Special handling for collect
        const collectionOutput = openAPI.components?.schemas?.[
          'CollectInvocationOutput'
        ] as OpenAPIV3.SchemaObject;
        outputs = {
          item: {
            name: 'collection',
            title: collectionOutput?.title ?? '',
            description: collectionOutput?.description ?? '',
            type: 'Collection',
          },
        };
      } else {
        outputs = buildOutputFieldTemplates(rawOutput, openAPI);
      }

      const invocation: InvocationTemplate = {
        title,
        type,
        tags,
        description: schema.description ?? '',
        inputs,
        outputs,
      };

      Object.assign(acc, { [type]: invocation });
    }

    return acc;
  }, {});

  return invocations;
};
