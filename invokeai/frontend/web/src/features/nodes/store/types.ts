import { OpenAPIV3 } from 'openapi-types';
import { Edge, Node, OnConnectStartParams } from 'reactflow';
import {
  FieldType,
  InvocationEdgeExtra,
  InvocationTemplate,
  InvocationNodeData,
  NotesNodeData,
  CurrentImageNodeData,
  Workflow,
  NodeExecutionState,
} from '../types/types';

export type NodesState = {
  nodes: Node<InvocationNodeData | CurrentImageNodeData | NotesNodeData>[];
  edges: Edge<InvocationEdgeExtra>[];
  schema: OpenAPIV3.Document | null;
  nodeTemplates: Record<string, InvocationTemplate>;
  connectionStartParams: OnConnectStartParams | null;
  currentConnectionFieldType: FieldType | null;
  shouldShowFieldTypeLegend: boolean;
  shouldShowMinimapPanel: boolean;
  shouldValidateGraph: boolean;
  shouldAnimateEdges: boolean;
  nodeOpacity: number;
  shouldSnapToGrid: boolean;
  shouldColorEdges: boolean;
  selectedNodes: string[];
  selectedEdges: string[];
  workflow: Omit<Workflow, 'nodes' | 'edges'>;
  nodeExecutionStates: Record<string, NodeExecutionState>;
};
