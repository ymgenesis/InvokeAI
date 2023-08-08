import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { cloneDeep, uniqBy } from 'lodash-es';
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Connection,
  Edge,
  EdgeChange,
  EdgeRemoveChange,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  Node,
  NodeChange,
  OnConnectStartParams,
} from 'reactflow';
import { receivedOpenAPISchema } from 'services/api/thunks/schema';
import { ImageField } from 'services/api/types';
import { DRAG_HANDLE_CLASSNAME } from '../hooks/useBuildInvocation';
import {
  BooleanInputFieldValue,
  ColorInputFieldValue,
  ControlNetModelInputFieldValue,
  EnumInputFieldValue,
  ExposedField,
  FloatInputFieldValue,
  ImageInputFieldValue,
  InputFieldValue,
  IntegerInputFieldValue,
  InvocationTemplate,
  InvocationNodeData,
  isInvocationNode,
  LoRAModelInputFieldValue,
  MainModelInputFieldValue,
  NotesNodeData,
  CurrentImageNodeData,
  RefinerModelInputFieldValue,
  StringInputFieldValue,
  VaeModelInputFieldValue,
  Workflow,
  isNotesNode,
} from '../types/types';
import { NodesState } from './types';

export const initialNodesState: NodesState = {
  nodes: [],
  edges: [],
  schema: null,
  nodeTemplates: {},
  connectionStartParams: null,
  currentConnectionFieldType: null,
  shouldShowFieldTypeLegend: false,
  shouldShowMinimapPanel: true,
  shouldValidateGraph: true,
  shouldAnimateEdges: true,
  shouldSnapToGrid: true,
  shouldColorEdges: true,
  nodeOpacity: 1,
  selectedNodes: [],
  selectedEdges: [],
  workflow: {
    name: '',
    author: '',
    description: '',
    notes: '',
    tags: '',
    contact: '',
    version: '',
    exposedFields: [],
  },
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
  const node = state.nodes?.[nodeIndex];
  if (!isInvocationNode(node)) {
    return;
  }
  const input = node.data?.inputs[fieldName];
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
    nodeAdded: (
      state,
      action: PayloadAction<
        Node<InvocationNodeData | CurrentImageNodeData | NotesNodeData>
      >
    ) => {
      state.nodes.push(action.payload);
    },
    edgesChanged: (state, action: PayloadAction<EdgeChange[]>) => {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },
    connectionStarted: (state, action: PayloadAction<OnConnectStartParams>) => {
      state.connectionStartParams = action.payload;
      const { nodeId, handleId, handleType } = action.payload;
      if (!nodeId || !handleId) {
        return;
      }
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
      const node = state.nodes?.[nodeIndex];
      if (!isInvocationNode(node)) {
        return;
      }
      const field =
        handleType === 'source'
          ? node.data.outputs[handleId]
          : node.data.inputs[handleId];
      state.currentConnectionFieldType = field?.type ?? null;
    },
    connectionMade: (state, action: PayloadAction<Connection>) => {
      const fieldType = state.currentConnectionFieldType;
      if (!fieldType) {
        return;
      }
      state.edges = addEdge(
        { ...action.payload, type: 'default' },
        state.edges
      );
    },
    connectionEnded: (state) => {
      state.connectionStartParams = null;
      state.currentConnectionFieldType = null;
    },
    nodeIsOpenChanged: (
      state,
      action: PayloadAction<{ nodeId: string; isOpen: boolean }>
    ) => {
      const { nodeId, isOpen } = action.payload;
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);

      const node = state.nodes?.[nodeIndex];
      if (!isInvocationNode(node) && !isNotesNode(node)) {
        return;
      }

      node.data.isOpen = isOpen;

      if (!isInvocationNode(node)) {
        return;
      }

      // edges between two closed nodes should not be visible:
      // - if the node was just opened, we need to make all its edges visible
      // - if the edge was just closed, we need to check all its edges and hide them if both nodes are closed

      const connectedEdges = getConnectedEdges([node], state.edges);

      if (isOpen) {
        // reset hidden status of all edges
        connectedEdges.forEach((edge) => {
          delete edge.hidden;
        });
        // delete dummy edges
        connectedEdges.forEach((edge) => {
          if (edge.type === 'collapsed') {
            state.edges = state.edges.filter((e) => e.id !== edge.id);
          }
        });
      } else {
        const closedIncomers = getIncomers(
          node,
          state.nodes,
          state.edges
        ).filter(
          (node) => isInvocationNode(node) && node.data.isOpen === false
        );

        const closedOutgoers = getOutgoers(
          node,
          state.nodes,
          state.edges
        ).filter(
          (node) => isInvocationNode(node) && node.data.isOpen === false
        );

        const collapsedEdgesToCreate: Edge<{ count: number }>[] = [];

        // hide all edges
        connectedEdges.forEach((edge) => {
          if (
            edge.target === nodeId &&
            closedIncomers.find((node) => node.id === edge.source)
          ) {
            edge.hidden = true;
            const collapsedEdge = collapsedEdgesToCreate.find(
              (e) => e.source === edge.source && e.target === edge.target
            );
            if (collapsedEdge) {
              collapsedEdge.data = {
                count: (collapsedEdge.data?.count ?? 0) + 1,
              };
            } else {
              collapsedEdgesToCreate.push({
                id: `${edge.source}-${edge.target}-collapsed`,
                source: edge.source,
                target: edge.target,
                type: 'collapsed',
                data: { count: 1 },
              });
            }
          }
          if (
            edge.source === nodeId &&
            closedOutgoers.find((node) => node.id === edge.target)
          ) {
            const collapsedEdge = collapsedEdgesToCreate.find(
              (e) => e.source === edge.source && e.target === edge.target
            );
            edge.hidden = true;
            if (collapsedEdge) {
              collapsedEdge.data = {
                count: (collapsedEdge.data?.count ?? 0) + 1,
              };
            } else {
              collapsedEdgesToCreate.push({
                id: `${edge.source}-${edge.target}-collapsed`,
                source: edge.source,
                target: edge.target,
                type: 'collapsed',
                data: { count: 1 },
              });
            }
          }
        });
        if (collapsedEdgesToCreate.length) {
          state.edges = applyEdgeChanges(
            collapsedEdgesToCreate.map((edge) => ({ type: 'add', item: edge })),
            state.edges
          );
        }
      }
    },
    edgesDeleted: (state, action: PayloadAction<Edge[]>) => {
      const edges = action.payload;
      const collapsedEdges = edges.filter((e) => e.type === 'collapsed');

      // if we delete a collapsed edge, we need to delete all collapsed edges between the same nodes
      if (collapsedEdges.length) {
        const edgeChanges: EdgeRemoveChange[] = [];
        collapsedEdges.forEach((collapsedEdge) => {
          state.edges.forEach((edge) => {
            if (
              edge.source === collapsedEdge.source &&
              edge.target === collapsedEdge.target
            ) {
              edgeChanges.push({ id: edge.id, type: 'remove' });
            }
          });
        });
        state.edges = applyEdgeChanges(edgeChanges, state.edges);
      }
    },
    nodeLabelChanged: (
      state,
      action: PayloadAction<{ nodeId: string; label: string }>
    ) => {
      const { nodeId, label } = action.payload;
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
      const node = state.nodes?.[nodeIndex];
      if (!isInvocationNode(node)) {
        return;
      }
      node.data.label = label;
    },
    nodeNotesChanged: (
      state,
      action: PayloadAction<{ nodeId: string; notes: string }>
    ) => {
      const { nodeId, notes } = action.payload;
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
      const node = state.nodes?.[nodeIndex];
      if (!isInvocationNode(node)) {
        return;
      }
      node.data.notes = notes;
    },
    selectedNodesChanged: (state, action: PayloadAction<string[]>) => {
      state.selectedNodes = action.payload;
    },
    selectedEdgesChanged: (state, action: PayloadAction<string[]>) => {
      state.selectedEdges = action.payload;
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

      const node = state.nodes?.[nodeIndex];

      if (!isInvocationNode(node)) {
        return;
      }

      const input = node.data?.inputs[fieldName];
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
    nodeClicked: (
      state,
      action: PayloadAction<{ nodeId: string; ctrlOrMeta?: boolean }>
    ) => {
      const { nodeId, ctrlOrMeta } = action.payload;
      state.nodes.forEach((node) => {
        if (node.id === nodeId) {
          node.selected = true;
        } else if (!ctrlOrMeta) {
          node.selected = false;
        }
      });
    },
    notesNodeValueChanged: (
      state,
      action: PayloadAction<{ nodeId: string; value: string }>
    ) => {
      const { nodeId, value } = action.payload;
      const nodeIndex = state.nodes.findIndex((n) => n.id === nodeId);
      const node = state.nodes?.[nodeIndex];
      if (!isNotesNode(node)) {
        return;
      }
      node.data.notes = value;
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
      state.nodeTemplates = action.payload;
    },
    nodeEditorReset: (state) => {
      state.nodes = [];
      state.edges = [];
    },
    shouldValidateGraphChanged: (state, action: PayloadAction<boolean>) => {
      state.shouldValidateGraph = action.payload;
    },
    shouldAnimateEdgesChanged: (state, action: PayloadAction<boolean>) => {
      state.shouldAnimateEdges = action.payload;
    },
    shouldSnapToGridChanged: (state, action: PayloadAction<boolean>) => {
      state.shouldSnapToGrid = action.payload;
    },
    shouldColorEdgesChanged: (state, action: PayloadAction<boolean>) => {
      state.shouldColorEdges = action.payload;
    },
    nodeOpacityChanged: (state, action: PayloadAction<number>) => {
      state.nodeOpacity = action.payload;
    },
    loadFileNodes: (
      state,
      action: PayloadAction<Node<InvocationNodeData>[]>
    ) => {
      state.nodes = action.payload;
    },
    loadFileEdges: (state, action: PayloadAction<Edge[]>) => {
      state.edges = action.payload;
    },
    workflowNameChanged: (state, action: PayloadAction<string>) => {
      state.workflow.name = action.payload;
    },
    workflowDescriptionChanged: (state, action: PayloadAction<string>) => {
      state.workflow.description = action.payload;
    },
    workflowTagsChanged: (state, action: PayloadAction<string>) => {
      state.workflow.tags = action.payload;
    },
    workflowAuthorChanged: (state, action: PayloadAction<string>) => {
      state.workflow.author = action.payload;
    },
    workflowNotesChanged: (state, action: PayloadAction<string>) => {
      state.workflow.notes = action.payload;
    },
    workflowVersionChanged: (state, action: PayloadAction<string>) => {
      state.workflow.version = action.payload;
    },
    workflowContactChanged: (state, action: PayloadAction<string>) => {
      state.workflow.contact = action.payload;
    },
    workflowExposedFieldAdded: (state, action: PayloadAction<ExposedField>) => {
      state.workflow.exposedFields.push(action.payload);
    },
    workflowExposedFieldRemoved: (
      state,
      action: PayloadAction<ExposedField>
    ) => {
      state.workflow.exposedFields = state.workflow.exposedFields.filter(
        (field) =>
          field.nodeId !== action.payload.nodeId &&
          field.fieldId !== action.payload.fieldId
      );
    },
    workflowLoaded: (state, action: PayloadAction<Workflow>) => {
      const { nodes, edges, ...workflow } = action.payload;
      state.workflow = workflow;
      state.nodes = applyNodeChanges(
        nodes.map((node) => ({
          item: { ...node, dragHandle: `.${DRAG_HANDLE_CLASSNAME}` },
          type: 'add',
        })),
        []
      );
      state.edges = applyEdgeChanges(
        edges.map((edge) => ({ item: edge, type: 'add' })),
        []
      );
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
  nodeClicked,
  shouldShowFieldTypeLegendChanged,
  shouldShowMinimapPanelChanged,
  nodeTemplatesBuilt,
  nodeEditorReset,
  imageCollectionFieldValueChanged,
  loadFileNodes,
  loadFileEdges,
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
  nodeLabelChanged,
  nodeNotesChanged,
  edgesDeleted,
  shouldValidateGraphChanged,
  shouldAnimateEdgesChanged,
  nodeOpacityChanged,
  shouldSnapToGridChanged,
  shouldColorEdgesChanged,
  selectedNodesChanged,
  selectedEdgesChanged,
  workflowNameChanged,
  workflowDescriptionChanged,
  workflowTagsChanged,
  workflowAuthorChanged,
  workflowNotesChanged,
  workflowVersionChanged,
  workflowContactChanged,
  workflowExposedFieldAdded,
  workflowExposedFieldRemoved,
  workflowLoaded,
  notesNodeValueChanged,
} = nodesSlice.actions;

export default nodesSlice.reducer;
