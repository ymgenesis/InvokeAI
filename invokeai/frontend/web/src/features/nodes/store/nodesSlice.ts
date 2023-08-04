import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { cloneDeep, uniqBy } from 'lodash-es';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  OnConnectStartParams,
} from 'reactflow';
import { receivedOpenAPISchema } from 'services/api/thunks/schema';
import { ImageField } from 'services/api/types';
import {
  BooleanInputFieldValue,
  ColorInputFieldValue,
  ControlNetModelInputFieldValue,
  EnumInputFieldValue,
  FloatInputFieldValue,
  ImageInputFieldValue,
  InputFieldValue,
  IntegerInputFieldValue,
  InvocationTemplate,
  InvocationValue,
  LoRAModelInputFieldValue,
  MainModelInputFieldValue,
  RefinerModelInputFieldValue,
  StringInputFieldValue,
  VaeModelInputFieldValue,
} from '../types/types';
import { NodesState } from './types';

export const initialNodesState: NodesState = {
  nodes: [],
  edges: [],
  schema: null,
  invocationTemplates: {},
  connectionStartParams: null,
  shouldShowGraphOverlay: false,
  shouldShowFieldTypeLegend: false,
  shouldShowMinimapPanel: true,
  editorInstance: undefined,
  progressNodeSize: { width: 512, height: 512 },
};

type FieldValueAction<T extends InputFieldValue> = PayloadAction<{
  nodeId: string;
  fieldName: string;
  value: T['value'];
}>;

const fieldValueReducer = <T extends InputFieldValue>(
  state: NodesState,
  action: FieldValueAction<T>
) => {
  const { nodeId, fieldName, value } = action.payload;
  const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
  const input = state.nodes?.[nodeIndex]?.data?.inputs[fieldName];
  if (!input) {
    return;
  }
  if (nodeIndex > -1) {
    input.value = value;
  }
};

const nodesSlice = createSlice({
  name: 'nodes',
  initialState: initialNodesState,
  reducers: {
    nodesChanged: (state, action: PayloadAction<NodeChange[]>) => {
      state.nodes = applyNodeChanges(action.payload, state.nodes);
    },
    nodeAdded: (state, action: PayloadAction<Node<InvocationValue>>) => {
      state.nodes.push(action.payload);
    },
    edgesChanged: (state, action: PayloadAction<EdgeChange[]>) => {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },
    connectionStarted: (state, action: PayloadAction<OnConnectStartParams>) => {
      state.connectionStartParams = action.payload;
    },
    connectionMade: (state, action: PayloadAction<Connection>) => {
      state.edges = addEdge(action.payload, state.edges);
    },
    connectionEnded: (state) => {
      state.connectionStartParams = null;
    },
    nodeIsOpenChanged: (
      state,
      action: PayloadAction<{ nodeId: string; isOpen: boolean }>
    ) => {
      const { nodeId, isOpen } = action.payload;
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
      const node = state.nodes?.[nodeIndex];
      if (!node) {
        return;
      }
      node.data.isOpen = isOpen;
    },
    nodeUserLabelChanged: (
      state,
      action: PayloadAction<{ nodeId: string; userLabel: string }>
    ) => {
      const { nodeId, userLabel } = action.payload;
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
      const node = state.nodes?.[nodeIndex];
      if (!node) {
        return;
      }
      node.data.userLabel = userLabel;
    },
    fieldStringValueChanged: (
      state,
      action: FieldValueAction<StringInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldNumberValueChanged: (
      state,
      action: FieldValueAction<IntegerInputFieldValue | FloatInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldBooleanValueChanged: (
      state,
      action: FieldValueAction<BooleanInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldImageValueChanged: (
      state,
      action: FieldValueAction<ImageInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldColorValueChanged: (
      state,
      action: FieldValueAction<ColorInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldMainModelValueChanged: (
      state,
      action: FieldValueAction<MainModelInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldRefinerModelValueChanged: (
      state,
      action: FieldValueAction<RefinerModelInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldVaeModelValueChanged: (
      state,
      action: FieldValueAction<VaeModelInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldLoRAModelValueChanged: (
      state,
      action: FieldValueAction<LoRAModelInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldControlNetModelValueChanged: (
      state,
      action: FieldValueAction<ControlNetModelInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    fieldEnumModelValueChanged: (
      state,
      action: FieldValueAction<EnumInputFieldValue>
    ) => {
      fieldValueReducer(state, action);
    },
    imageCollectionFieldValueChanged: (
      state,
      action: PayloadAction<{
        nodeId: string;
        fieldName: string;
        value: ImageField[];
      }>
    ) => {
      const { nodeId, fieldName, value } = action.payload;
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);

      if (nodeIndex === -1) {
        return;
      }

      const input = state.nodes?.[nodeIndex]?.data?.inputs[fieldName];
      if (!input) {
        return;
      }

      const currentValue = cloneDeep(input.value);

      if (!currentValue) {
        input.value = value;
        return;
      }

      input.value = uniqBy(
        (currentValue as ImageField[]).concat(value),
        'image_name'
      );
    },
    shouldShowGraphOverlayChanged: (state, action: PayloadAction<boolean>) => {
      state.shouldShowGraphOverlay = action.payload;
    },
    shouldShowFieldTypeLegendChanged: (
      state,
      action: PayloadAction<boolean>
    ) => {
      state.shouldShowFieldTypeLegend = action.payload;
    },
    shouldShowMinimapPanelChanged: (state, action: PayloadAction<boolean>) => {
      state.shouldShowMinimapPanel = action.payload;
    },
    nodeTemplatesBuilt: (
      state,
      action: PayloadAction<Record<string, InvocationTemplate>>
    ) => {
      state.invocationTemplates = action.payload;
    },
    nodeEditorReset: (state) => {
      state.nodes = [];
      state.edges = [];
    },
    setEditorInstance: (state, action) => {
      state.editorInstance = action.payload;
    },
    loadFileNodes: (state, action: PayloadAction<Node<InvocationValue>[]>) => {
      state.nodes = action.payload;
    },
    loadFileEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
    },
    setProgressNodeSize: (
      state,
      action: PayloadAction<{ width: number; height: number }>
    ) => {
      state.progressNodeSize = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(receivedOpenAPISchema.fulfilled, (state, action) => {
      state.schema = action.payload;
    });
  },
});

export const {
  nodesChanged,
  edgesChanged,
  nodeAdded,
  connectionMade,
  connectionStarted,
  connectionEnded,
  shouldShowGraphOverlayChanged,
  shouldShowFieldTypeLegendChanged,
  shouldShowMinimapPanelChanged,
  nodeTemplatesBuilt,
  nodeEditorReset,
  imageCollectionFieldValueChanged,
  setEditorInstance,
  loadFileNodes,
  loadFileEdges,
  setProgressNodeSize,
  fieldStringValueChanged,
  fieldNumberValueChanged,
  fieldBooleanValueChanged,
  fieldImageValueChanged,
  fieldColorValueChanged,
  fieldMainModelValueChanged,
  fieldVaeModelValueChanged,
  fieldLoRAModelValueChanged,
  fieldEnumModelValueChanged,
  fieldControlNetModelValueChanged,
  fieldRefinerModelValueChanged,
  nodeIsOpenChanged,
  nodeUserLabelChanged,
} = nodesSlice.actions;

export default nodesSlice.reducer;
